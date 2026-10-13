// Blog autopilot: Claude writes and posts on a schedule — once per due time, with rotating photos.
const test = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

// Claude stand-in (no API calls in tests).
const writer = require("../../utils/blogWriter");
let calls = 0, failNext = false;
writer.draftBlogPost = async ({ avoidTitles }) => {
  calls++;
  if (failNext) { failNext = false; throw new Error("Claude busy"); }
  return { title: `Post ${calls}`, description: "Summary", content: `Body ${calls}. Avoided ${avoidTitles.length} titles.` };
};
const auto = require("../../utils/blogAutopilot");
const BlogPost = require("../../models/BlogPost");
const SystemSetting = require("../../models/SystemSetting");

let mongod;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
});
test.after(async () => { await mongoose.disconnect(); await mongod.stop(); });

const setDue = (d) => SystemSetting.updateOne({ key: "blogAutopilot" }, { $set: { "value.nextRunAt": d } });

test("needs instructions; switching on sets the next post time", async () => {
  await assert.rejects(auto.saveSettings({ enabled: true }), /instructions/);
  const s = await auto.saveSettings({ enabled: true, instructions: "Cleaning tips for Manchester", everyDays: 3, time: "09:00", images: "https://img.test/a.jpg not-a-link" });
  assert.equal(s.enabled, true);
  assert.ok(new Date(s.nextRunAt) > new Date());
  assert.deepEqual(s.images, ["https://img.test/a.jpg"]);
});

test("a due post is written and published once, and the next one is set 3 days later", async () => {
  const due = new Date(Date.now() - 60 * 1000);
  await setDue(due);
  const [a, b] = await Promise.all([auto.processDue(), auto.processDue()]); // two ticks at once
  assert.equal([a, b].filter(Boolean).length, 1);
  const posts = await BlogPost.find({ source: "autopilot" }).lean();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].published, true);
  assert.equal(posts[0].image, "https://img.test/a.jpg");
  const s = await auto.getSettings();
  assert.ok(new Date(s.nextRunAt) > new Date(), "next post is in the future");
  assert.equal(new Date(s.nextRunAt).getTime() - due.getTime(), 3 * 86400000);
  assert.match(s.lastResult, /^Posted: Post/);
  assert.equal(await auto.processDue(), null, "nothing more until then");
});

test("photos rotate: the one used longest ago comes next", async () => {
  await BlogPost.create({ title: "Old", description: "d", image: "https://img.test/b.jpg", publishAt: new Date("2025-01-01") });
  await setDue(new Date(Date.now() - 1000));
  const post = await auto.processDue();
  assert.equal(post.image, "https://img.test/b.jpg");
});

test("a failed run retries in an hour; draft mode saves without publishing", async () => {
  failNext = true;
  await setDue(new Date(Date.now() - 1000));
  assert.equal(await auto.processDue(), null);
  let s = await auto.getSettings();
  assert.match(s.lastResult, /Failed: Claude busy.*trying again in an hour/);
  const inMins = (new Date(s.nextRunAt) - Date.now()) / 60000;
  assert.ok(inMins > 55 && inMins <= 60, `retry in ~1h, got ${inMins}`);

  await auto.saveSettings({ mode: "draft" });
  const post = await auto.runNow();
  assert.equal(post.published, false);
  s = await auto.getSettings();
  assert.match(s.lastResult, /^Saved as draft/);
});
