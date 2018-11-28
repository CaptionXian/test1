const config = require('config')
const ratelimit = require('smart-limiter').koav2
const redis = require('../services/redis')

module.exports = (options = {}) => {
  return ratelimit({
    redis: redis,
    prefix: config.RATELIMIT.PREFIX,
    getId: ctx => (ctx.user && ctx.user._id) || ctx.get('x-real-ip') || ctx.ip,
    policy: config.RATELIMIT.POLICY
  })
}
