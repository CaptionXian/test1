const _ = require('lodash')
const ilog = require('ilog')
const config = require('config')
const debug = require('debug')('okr:errorhandler')
const createError = require('http-errors')
const HttpError = require('../utils/error')

module.exports = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    debug(err)

    let _err = err

    if (!(err instanceof HttpError)) {
      _err = createError.createErr(err)
    }

    // let { locale } = req

    let locale = 'en'
    if (!['en', 'zh'].includes(locale)) {
      locale = 'en'
    }

    if (_.isFunction(_err.setLocale)) {
      _err.setLocale(locale)
    }

    if (_err.status >= 500) {
      _err.uri = ctx.originalUrl
      if (config.util.getEnv('NODE_ENV') === 'development') {
        console.error(_err)
      } else {
        ilog.error(_err)
      }
    }

    const body = {
      name: _err.name,
      message: _err.message
    }

    if (_err.data) {
      body.data = _err.data
    }

    ctx.status = _err.status || 500
    ctx.body = JSON.stringify(body)
  }
}
