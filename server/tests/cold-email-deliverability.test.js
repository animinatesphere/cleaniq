// Warm-up, pacing and sending window for cold email (utils/deliverability.js + coldEmailEngine).
const test = require("node:test");
const assert = require("node:assert/strict");
const { effectiveDailyLimit, warmupDay, inSendingWindow, nextSendAfter } = require("../utils/deliverability");
const { htmlToText } = require("../utils/coldEmailEngine");

const daysAgo = (n) => new Date(Date.now() - n * 86400000 - 60000);

test("warm-up starts at 5 a day and grows by 3 a day up to the mailbox limit", () => {
  assert.equal(effectiveDailyLimit({ dailyLimit: 40, createdAt: new Date() }), 5);
  assert.equal(effectiveDailyLimit({ dailyLimit: 40, warmupStartedAt: daysAgo(1) }), 8);
  assert.equal(effectiveDailyLimit({ dailyLimit: 40, warmupStartedAt: daysAgo(9) }), 32);
  assert.equal(effectiveDailyLimit({ dailyLimit: 40, warmupStartedAt: daysAgo(30) }), 40);
  assert.equal(effectiveDailyLimit({ dailyLimit: 40, createdAt: new Date(), warmupEnabled: false }), 40);
  assert.equal(warmupDay({ createdAt: daysAgo(2) }), 3);
});

test("sends only Monday to Friday, 8am to 6pm UK time", () => {
  assert.equal(inSendingWindow(new Date("2026-11-16T09:00:00Z")), true); // Mon 9am GMT
  assert.equal(inSendingWindow(new Date("2026-11-16T07:59:00Z")), false); // Mon before 8am
  assert.equal(inSendingWindow(new Date("2026-11-16T18:00:00Z")), false); // Mon 6pm
  assert.equal(inSendingWindow(new Date("2026-11-14T12:00:00Z")), false); // Saturday
  assert.equal(inSendingWindow(new Date("2026-07-06T07:30:00Z")), true); // Mon 8:30am BST (summer time)
});

test("gap between emails from one mailbox is 4 to 9 minutes", () => {
  const now = new Date();
  for (let i = 0; i < 50; i++) {
    const gap = (nextSendAfter(now) - now) / 60000;
    assert.ok(gap >= 4 && gap <= 9, `gap ${gap}`);
  }
});

test("plain-text copy of an email keeps the words and links", () => {
  const text = htmlToText('<p>Hi Sam,</p><p>See <a href="https://x.com/a">our prices</a> &amp; reply.</p>');
  assert.match(text, /Hi Sam,/);
  assert.match(text, /our prices \(https:\/\/x\.com\/a\) & reply\./);
});
