const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 6;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map();

function getLoginKey(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown";
  const username = (req.body?.username || "").toLowerCase().trim();
  return `${ip}:${username}`;
}

function loginRateLimiter(req, res, next) {
  const key = getLoginKey(req);
  const now = Date.now();
  const entry = loginAttempts.get(key) || {
    count: 0,
    firstAttempt: now,
    blockedUntil: null,
  };

  if (entry.blockedUntil && entry.blockedUntil > now) {
    const waitSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return res.status(429).json({
      message: `Too many login attempts. Try again in ${waitSeconds} seconds.`,
    });
  }

  if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    entry.count = 0;
    entry.firstAttempt = now;
    entry.blockedUntil = null;
  }

  entry.count += 1;
  if (entry.count > MAX_LOGIN_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(key, entry);
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  }

  loginAttempts.set(key, entry);
  next();
}

function resetLoginRateLimiter(req) {
  const key = getLoginKey(req);
  loginAttempts.delete(key);
}

module.exports = {
  loginRateLimiter,
  resetLoginRateLimiter,
};
