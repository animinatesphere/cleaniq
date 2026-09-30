// The AI receptionist's save_enquiry tool: saves a Lead the team can follow up, one per
// phone number per day, and works without an email (phone enquiries). Throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

const sent = [];
require("../../utils/emailService").sendEmail = async (m) => { sent.push(m); return true; };
const Lead = require("../../models/Lead");
const { makeToolRunner } = require("../../utils/aiTools");

let mongod;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
});
test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const runner = (channel, extra = {}) => makeToolRunner({ phone: "+447700900123", channel, ...extra });

test("a phone enquiry without an email is saved as a lead and the team is emailed", async () => {
  const r = await runner("voice")("save_enquiry", {
    name: "Jane Smith", service: "End of Tenancy Cleaning", details: "2 bed flat", postcode: "M14", callbackTime: "after 5pm",
  });
  assert.equal(r.saved, true);
  const lead = await Lead.findById(r.leadId).lean();
  assert.equal(lead.source, "AI Phone");
  assert.equal(lead.phone, "+447700900123");
  assert.equal(lead.email, "");
  assert.equal(lead.stage, "New");
  assert.match(lead.message, /Details: 2 bed flat\nArea\/postcode: M14\nBest time to call: after 5pm/);
  await new Promise((res) => setTimeout(res, 50));
  assert.match(sent[0].subject, /New enquiry \(AI Phone\): Jane Smith – End of Tenancy Cleaning/);
});

test("more details the same day update the same lead instead of adding another", async () => {
  const r = await runner("voice")("save_enquiry", { name: "Jane Smith", email: "Jane@Example.com", service: "End of Tenancy Cleaning", details: "2 bed flat, oven too" });
  assert.equal(await Lead.countDocuments(), 1);
  const lead = await Lead.findById(r.leadId).lean();
  assert.equal(lead.email, "jane@example.com");
  assert.match(lead.message, /oven too/);
});

test("WhatsApp enquiries are tagged, and bad input is sent back to the AI to fix", async () => {
  const run = runner("whatsapp", { phone: "+447700900999" });
  assert.match((await run("save_enquiry", { service: "Deep Cleaning" })).error, /name/);
  assert.match((await run("save_enquiry", { name: "Bob" })).error, /what they need/);
  assert.match((await run("save_enquiry", { name: "Bob", service: "Deep Cleaning", email: "bob@" })).error, /email/);
  const r = await run("save_enquiry", { name: "Bob", service: "Deep Cleaning" });
  assert.equal((await Lead.findById(r.leadId)).source, "AI WhatsApp");
});

test("test chats don't save anything", async () => {
  const before = await Lead.countDocuments();
  const r = await runner("whatsapp", { phone: "+447700900555", dryRun: true })("save_enquiry", { name: "Test", service: "Deep Cleaning" });
  assert.equal(r.dryRun, true);
  assert.equal(await Lead.countDocuments(), before);
});
