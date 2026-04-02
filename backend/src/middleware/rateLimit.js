import rateLimit from "express-rate-limit";

function getWindowMs(name, fallbackSeconds) {
  return Number(process.env[name] || fallbackSeconds) * 1000;
}

function getMaxRequests(name, fallbackCount) {
  return Number(process.env[name] || fallbackCount);
}

export const generalLimiter = rateLimit({
  windowMs: getWindowMs("RATE_LIMIT_WINDOW_SECONDS", 60),
  max: getMaxRequests("RATE_LIMIT_MAX_REQUESTS", 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again soon."
  }
});

export const authLimiter = rateLimit({
  windowMs: getWindowMs("AUTH_RATE_LIMIT_WINDOW_SECONDS", 60),
  max: getMaxRequests("AUTH_RATE_LIMIT_MAX_REQUESTS", 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authenticated requests. Please slow down."
  }
});

export const aiLimiter = rateLimit({
  windowMs: getWindowMs("AI_RATE_LIMIT_WINDOW_SECONDS", 300),
  max: getMaxRequests("AI_RATE_LIMIT_MAX_REQUESTS", 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AI request limit reached. Please wait before trying again."
  }
});
