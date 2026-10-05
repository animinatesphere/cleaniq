// Turning what customers say into exact dates (UK time). "Now" is Monday 5 October 2026, 10:00 UK.
const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveUkDate, upcomingCalendar } = require("../utils/ukDate");

const now = new Date("2026-10-05T09:00:00Z"); // Monday 5 Oct 2026, 10:00 BST
const d = (s) => resolveUkDate(s, now).iso;

test("relative days", () => {
  assert.equal(d("today"), "2026-10-05");
  assert.equal(d("Tomorrow"), "2026-10-06");
  assert.equal(d("day after tomorrow"), "2026-10-07");
  assert.equal(d("in 3 days"), "2026-10-08");
  assert.equal(d("in a week"), "2026-10-12");
  assert.equal(d("next week"), "2026-10-12");
});

test("weekdays", () => {
  assert.equal(d("Friday"), "2026-10-09");
  assert.equal(d("this friday"), "2026-10-09");
  assert.equal(d("next Friday"), "2026-10-09"); // 4 days away: this week's
  assert.equal(d("next tuesday"), "2026-10-13"); // tomorrow would be odd for "next": the week after
  assert.equal(d("monday"), "2026-10-12"); // said on a Monday: next Monday
  assert.equal(d("on wed"), "2026-10-07");
});

test("day and month, UK order, rolling into next year when passed", () => {
  assert.equal(d("28th October"), "2026-10-28");
  assert.equal(d("the 28th of oct"), "2026-10-28");
  assert.equal(d("October 28"), "2026-10-28");
  assert.equal(d("28/10"), "2026-10-28");
  assert.equal(d("02/11/2026"), "2026-11-02"); // 2 November, not 11 February
  assert.equal(d("3 jan"), "2027-01-03");
  assert.equal(d("1st October"), "2027-10-01"); // already passed this year
  assert.equal(d("the 28th"), "2026-10-28");
  assert.equal(d("the 2nd"), "2026-11-02"); // passed this month: next month
  assert.equal(d("2026-10-30"), "2026-10-30");
});

test("labels to read back, and clear errors", () => {
  assert.equal(resolveUkDate("friday", now).label, "Friday 9 October 2026");
  assert.match(resolveUkDate("31/02", now).error, /isn't a real date/);
  assert.match(resolveUkDate("whenever suits", now).error, /couldn't work out the date/);
  assert.match(upcomingCalendar(3, now), /^Today Monday 5 October = 2026-10-05\nTomorrow Tuesday 6 October = 2026-10-06\nWednesday 7 October = 2026-10-07$/);
});

test("a weekday before the date is fine, and a mismatch is caught", () => {
  assert.equal(d("Thursday 8 October"), "2026-10-08");
  assert.equal(d("thursday the 8th"), "2026-10-08");
  assert.equal(d("Friday, October 9"), "2026-10-09");
  assert.match(resolveUkDate("Thursday 9 October", now).error, /9 October 2026 is a Friday, not a Thursday/);
});
