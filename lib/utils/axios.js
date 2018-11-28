const axios = require('axios')

module.exports = {
  /**
   * -- {带token的get请求} --
   * callback:
   * - err, 数据库异常
   * - result, 操作结果
   * @param {String}  url 访问地址
   * @param {String}  token Teambition唯一验证码
   * @param {async} Promise 回调函数
   * @author:ls
   */
  axios_get (url, token) {
    return axios({
      method: 'get',
      url: url,
      timeout: 60000,
      headers: { Authorization: `OAuth2 ${token}` }
    })
  },
  /**
   * -- {post请求} --
   * callback:
   * - err, 数据库异常
   * - result, 操作结果
   * @param {String}  url 访问地址
   * @param {object}  data 传输数据
   * @param {async} Promise 回调函数
   * @author:ls
   */
  axios_post (url, data) {
    return axios(url, {
      method: 'post',
      url: url,
      timeout: 60000,
      data: data
    })
  },
  /**
   * -- {带token的post请求} --
   * callback:
   * - err, 数据库异常
   * - result, 操作结果
   * @param {String}  url 访问地址
   * @param {object}  data 传输数据
   * @param {String}  token Teambition唯一验证码
   * @param {async} Promise 回调函数
   * @author:ls
   */
  axios_postToken (url, data, token) {
    return axios({
      method: 'post',
      url: url,
      data: data,
      timeout: 60000,
      headers: { Authorization: `OAuth2 ${token}` }
    })
  },
  /**
   * -- {有头部的post请求} --
   * callback:
   * - err, 数据库异常
   * - result, 操作结果
   * @param {String}  url 访问地址
   * @param {Object}  headers 发送头部
   * @param {object}  data 传输数据
   * @param {async} Promise 回调函数
   * @author:ls
   */
  axios_head_post (url, headers, data) {
    return axios({
      method: 'post',
      url: url,
      timeout: 60000,
      headers,
      data
    })
  },

  /**
   * 执行多个并发请求
   * @param {Array} requestArr 请求数组
   * @author: lx
   */
  axios_all (requestArr) {
    return axios.all(requestArr)
  }
}
