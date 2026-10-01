// Hourly pay for the cleaner on a new booking: the service's own rate from the admin
// Staff Pay page, otherwise the standard rate (defaultWorkerRate), otherwise £13.
const Service = require("../models/Service");
const SystemSetting = require("../models/SystemSetting");

const FALLBACK_RATE = 13;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// following: a later visit of a regular clean → the service's "following sessions" pay if set.
async function workerRateFor(serviceName, { following = false } = {}) {
  try {
    if (serviceName && String(serviceName).trim()) {
      const matches = await Service.find({
        name: new RegExp(`^${escapeRegex(String(serviceName).trim())}$`, "i"),
      }).lean();
      const service = matches.find((s) => s.category === "Base") || matches[0];
      if (following && service?.workerFollowingRate > 0) return service.workerFollowingRate;
      if (service?.workerHourlyRate > 0) return service.workerHourlyRate;
    }
    const setting = await SystemSetting.findOne({ key: "defaultWorkerRate" }).lean();
    const standard = Number(setting?.value);
    return standard > 0 ? standard : FALLBACK_RATE;
  } catch {
    return FALLBACK_RATE;
  }
}

module.exports = { workerRateFor };
