const _ = require('lodash')
const createError = require('http-errors')
const errorPool = require('./errorpool')
const errors = require('./errors')

errors.forEach(err => errorPool.register(err.status, err.name, err.message))

createError.HttpError.prototype._localeArgs = []
createError.HttpError.prototype.setLocale = function (locale) {
  const err = errorPool.get(this.name)
  if (err) {
    if (err.name) {
      this.name = err.name
    }
    this.status = err.status
    const message = err.message[locale]
    if (typeof message === 'function') {
      this.message = message.apply(null, this._localeArgs)
    } else if (message) {
      this.message = message
    }
  }
  return this
}

// 使用方法：
// 1. createErr(400)
// 2. createErr(400, 'some thing error')
// 3. createErr('ParamError')
// 3. createErr('ParamError', 'dueDate')
createError.createErr = function (errName) {
  let err
  const apierr = errorPool.get(`${errName}`)

  if (apierr) {
    err = createError(apierr.status)
    if (apierr.name) {
      err.name = apierr.name
    } // 需要取得 locale 后才有 i18n 的 message
    err._localeArgs = _.slice(arguments, 1)
  } else {
    err = createError.apply(null, arguments)
  }
  return err
}

module.exports = createError.HttpError
