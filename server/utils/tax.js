// Tax (e.g. VAT) set by admin in Settings → Tax. When it's on, it's added on top of the service
// prices on the website, in the customer app and on regular-clean visits.
const SystemSetting = require("../models/SystemSetting");

const DEFAULT_TAX = { enabled: false, rate: 20, label: "VAT" };

function cleanTax(v = {}) {
  const rate = Number(v.rate);
  return {
    enabled: Boolean(v.enabled),
    rate: rate >= 0 && rate <= 100 ? Math.round(rate * 100) / 100 : DEFAULT_TAX.rate,
    label: String(v.label || DEFAULT_TAX.label).trim().slice(0, 20) || DEFAULT_TAX.label,
  };
}

async function getTax() {
  try {
    const s = await SystemSetting.findOne({ key: "tax" }).lean();
    return cleanTax(s?.value || DEFAULT_TAX);
  } catch {
    return { ...DEFAULT_TAX };
  }
}

// The tax on an amount, and the amount with tax, both to the penny.
function taxOn(amount, tax) {
  return tax?.enabled ? Math.round(Number(amount || 0) * tax.rate) / 100 : 0;
}
const withTax = (amount, tax) => Math.round((Number(amount || 0) + taxOn(amount, tax)) * 100) / 100;

module.exports = { getTax, cleanTax, taxOn, withTax, DEFAULT_TAX };
