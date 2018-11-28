const config = require('config')
const ilog = require('ilog')
module.exports = (options = {}) => {
  return async (ctx, next) => {
    const start = Date.now()

    const ip = ctx.get('x-real-ip') || ctx.ip
    const user = ctx.user && ctx.user._id
    await next()
    const duration = Date.now() - start

    if (config.LOG_REQ_LEVEL === 'dev') {
      ilog.debug(`${ip} ${ctx.method} ${ctx.url} ${ctx.status} ${duration}ms`)
    } else {
      ilog.info({
        ip: ip,
        user: user,
        method: ctx.method,
        url: ctx.url,
        status: ctx.status,
        duration: duration
      })
    }
  }
}
