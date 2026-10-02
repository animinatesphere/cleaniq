// Top-rated bonus: extra £/hr for cleaners whose customers rate them highly. Set by admin on the
// Staff Pay page (setting "topRatedBonus"). A cleaner qualifies with an average of at least
// minRating stars from at least minRatings ratings, so one lucky 5★ isn't enough.
const SystemSetting = require("../models/SystemSetting");
const { workerStats } = require("./workerStats");

const DEFAULTS = { amount: 0, minRating: 4.8, minRatings: 5 };

async function bonusSettings() {
  const s = await SystemSetting.findOne({ key: "topRatedBonus" }).lean().catch(() => null);
  const v = s?.value || {};
  return {
    amount: Math.max(0, Number(v.amount) || 0),
    minRating: Number(v.minRating) >= 1 && Number(v.minRating) <= 5 ? Number(v.minRating) : DEFAULTS.minRating,
    minRatings: Number(v.minRatings) >= 1 ? Math.floor(Number(v.minRatings)) : DEFAULTS.minRatings,
  };
}

function qualifies(settings, rating, ratingCount) {
  return settings.amount > 0 && rating != null && rating >= settings.minRating && ratingCount >= settings.minRatings;
}

// The bonus (£/hr) this cleaner gets right now, with the figures behind it.
async function bonusFor(workerId) {
  const settings = await bonusSettings();
  if (!settings.amount) return { bonus: 0, settings };
  const stats = await workerStats(workerId);
  const ok = stats && qualifies(settings, stats.rating, stats.ratingCount);
  return { bonus: ok ? settings.amount : 0, settings, rating: stats?.rating ?? null, ratingCount: stats?.ratingCount || 0 };
}

// Put the cleaner's bonus on a booking they're taking (or remove it when they're not).
// workerRate always = the job's base rate + workerRateBonus.
async function applyBonus(booking, workerId) {
  const base = (Number(booking.workerRate) || 0) - (Number(booking.workerRateBonus) || 0);
  const { bonus } = workerId ? await bonusFor(workerId) : { bonus: 0 };
  booking.workerRateBonus = bonus;
  if (base > 0 || bonus > 0) booking.workerRate = Math.round((base + bonus) * 100) / 100;
  return bonus;
}

module.exports = { bonusSettings, bonusFor, applyBonus, qualifies, DEFAULTS };
