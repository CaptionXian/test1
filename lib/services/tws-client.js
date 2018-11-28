const _ = require('lodash')
const ilog = require('ilog')
const debug = require('debug')('okr:tws-client')
// 为了测试时rewire可以替换request, 需要使用let
let request = require('../utils/request')
const getAppToken = require('./tws-auth').getAppToken
// const UA = require('../utils/ua')

// todo
const UAHeader = { 'User-Agent': '' }

class TWSClient {
  static request (opts = {}) {
    opts = _.merge(
      {},
      {
        timeout: 2000,
        json: true,
        strictSSL: false,
        headers: opts.headers ? Object.assign(opts.headers, UAHeader) : UAHeader
      },
      opts
    )

    return getAppToken()
      .then(token => {
        if (!opts.headers.Authorization) {
          opts.headers.Authorization = `Bearer ${token}`
        }
        debug('request', opts)
        return request(opts).then(body => {
          debug('response ok', body)
          return body
        })
      })
      .catch(err => {
        let response = err.response
        if (!response) {
          ilog.error(err)
        } else {
          debug('response fail', response.body)
        }
        throw err
      })
  }

  // 共用 static 方法, 子类需要定制时只需要修改 static request
  request (opts = {}) {
    return this.constructor.request.call(this, opts)
  }

  static getAppTokenHeader (_resourceId, resourceType) {
    return getAppToken(_resourceId, resourceType).then(token => {
      return { Authorization: `Bearer ${token}` }
    })
  }
}

module.exports = TWSClient
