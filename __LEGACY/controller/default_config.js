module.exports = {
  jwt: {
    expire_period :"days",
    expire_duration :8,
    custom_secret :false
  },
  rate_limiter: {
    windowMs: 10 * 60 * 1000,
    max: 0,
    delayMs: 0,
    keyGenerator: function (req) {
      return req.headers.authorization || req.body.client_secret || req.body.client_id || req.body.access_token || req.query.access_token || req.headers['x-access-token'] || req.ip;
    },
    expiry: 10 * 60,
    prefix: 'rate_limit:',
    message: JSON.stringify({
      error: 'Too many requests from this IP, try again in 10 minutes',
      code: 429,
    }),
  },
  use_rate_limits: false,
};