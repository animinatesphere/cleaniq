// A cleaner's numbers, always worked out from the records rather than running totals:
//   jobs done   completed bookings assigned to them
//   earned      each completed job's hours × the cleaner's rate for it
//   on hold     payouts not yet paid (each completed job creates one, paid 8 days later;
//               withdrawal requests too)
//   withdrawn   payouts marked as paid
//   available   earned − withdrawn − on hold (never below £0)
//   rating      average of the stars customers gave after their clean (1 decimal)
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Withdrawal = require("../models/Withdrawal");

const DONE = ["Completed", "Completed - Unpaid"];
const WAITING = ["upcoming", "pending", "approved", "processing"];
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// What the cleaner earns for one job (same sum the payout is created from).
function jobPay(b) {
  const hours = Number(b.details?.duration || b.workerDuration || b.duration || 0);
  return round2((Number(b.workerRate) || 0) * hours);
}

function ratingSummary(stars) {
  const valid = stars.map(Number).filter((s) => s >= 1 && s <= 5);
  if (!valid.length) return { rating: null, ratingCount: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  valid.forEach((s) => { breakdown[Math.round(s)] += 1; });
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return { rating: Math.round(avg * 10) / 10, ratingCount: valid.length, ratingBreakdown: breakdown };
}

async function workerStats(workerId) {
  if (!mongoose.isValidObjectId(workerId)) return null;
  const id = new mongoose.Types.ObjectId(String(workerId));
  const [done, rated, payouts] = await Promise.all([
    Booking.find({ assignedWorker: id, status: { $in: DONE } })
      .select("bookingId workerRate details.duration workerDuration duration jobEndTime updatedAt schedule.date")
      .lean(),
    Booking.find({ assignedWorker: id, "cleanerRating.stars": { $gte: 1 } }).select("cleanerRating").lean(),
    Withdrawal.find({ workerId: id }).select("amount status expectedPayoutDate").lean(),
  ]);

  const totalEarned = round2(done.reduce((sum, b) => sum + jobPay(b), 0));
  const withdrawn = round2(payouts.filter((w) => w.status === "completed").reduce((s, w) => s + (w.amount || 0), 0));
  const waiting = payouts.filter((w) => WAITING.includes(w.status));
  const onHold = round2(waiting.reduce((s, w) => s + (w.amount || 0), 0));
  const balance = round2(Math.max(0, totalEarned - withdrawn - onHold));

  // Earliest payout still to come.
  const next = waiting
    .filter((w) => w.expectedPayoutDate)
    .sort((a, b) => new Date(a.expectedPayoutDate) - new Date(b.expectedPayoutDate))[0];
  const nextPayout = next
    ? { date: next.expectedPayoutDate, amount: round2(waiting.filter((w) => String(w.expectedPayoutDate) === String(next.expectedPayoutDate)).reduce((s, w) => s + w.amount, 0)) }
    : null;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const earnedThisMonth = round2(done
    .filter((b) => new Date(b.jobEndTime || b.schedule?.date || b.updatedAt) >= monthStart)
    .reduce((sum, b) => sum + jobPay(b), 0));

  return {
    jobsDone: done.length,
    totalEarned,
    earnedThisMonth,
    withdrawn,
    onHold,
    balance,
    nextPayout,
    ...ratingSummary(rated.map((b) => b.cleanerRating.stars)),
  };
}

module.exports = { workerStats, jobPay, ratingSummary };
