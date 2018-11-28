const _ = require('lodash')
const config = require('config')
const baseUrl = require('url').parse(_.get(config, 'TWS.ORG.URL'))
const TWSClient = require('./tws-client')
const SoaOrg = require('@tng/soa-node-org')

class TWSOrgClient extends SoaOrg {
  constructor (_resourceId, resourceType) {
    super()
    this.host = baseUrl.host
    this.protocol = baseUrl.protocol.replace(':', '')
    this.endpoints = '/v1'
    this.maxAttempts = 1
    this._resourceId = _resourceId
    this.resourceType = resourceType
  }

  /**
   * @author leeqiang
   * @desc 处理 soa app token & _operatorId 头部信息
   * @super teambition.invokeGeneric
   */
  invokeGeneric (method, apiURL, params, callback) {
    if (!params) params = {}
    TWSClient.getAppTokenHeader(this._resourceId, this.resourceType).then(
      header => {
        if (this._operatorId) {
          header['X-Operator-Id'] = this._operatorId
        }
        if (!params.headers) params.headers = {}
        _.assign(params.headers, header)

        return super.invokeGeneric(method, apiURL, params, callback)
      }
    )
  }

  operatorId (_operatorId) {
    this._operatorId = _operatorId
    return this
  }
}

module.exports = TWSOrgClient
