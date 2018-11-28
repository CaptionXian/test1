const request = require('request-promise')
const uuid = require('uuid')
const ilog = require('ilog')
const _ = require('lodash')
const debugReq = require('debug')('okr:request:request')
const debugResp = require('debug')('okr:request:response')

module.exports = opts => {
  const requestId =
    opts.headers && opts.headers['X-Request-Id']
      ? opts.headers['X-Request-Id']
      : uuid.v4()

  const mergedHeaders = Object.assign(
    {
      'User-Agent': 'ua',
      'X-Request-Id': requestId
    },
    opts.headers
  )

  opts.headers = mergedHeaders

  const errorLogger = _.isFunction(opts.errorLogger)
    ? opts.errorLogger
    : ilog.error

  const defaultOpts = {
    // 默认禁止请求中跟随302, 防止ssrf
    followRedirect: false,
    timeout: 1000 * 2,
    json: true,
    gzip: true
  }
  debugReq('request', requestId, opts)
  return request(Object.assign({}, defaultOpts, opts))
    .then(body => {
      debugResp('response', requestId, body)
      return body
    })
    .catch(err => {
      let response = err.response

      // 防止验证信息泄露, 删除掉header中验证信息
      _.unset(err, 'options.headers.Authorization')
      // header中大小写不敏感 ref: https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
      _.unset(err, 'options.headers.authorization')

      if (!response) {
        errorLogger(err)
      }

      debugResp(
        'request fail',
        requestId,
        err.response ? err.response.body : err
      )

      throw err
    })
}
