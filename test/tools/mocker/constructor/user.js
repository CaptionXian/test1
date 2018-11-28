'use strict'

const ObjectId = require('mongoose').Types.ObjectId
const Mocker = require('../mocker')
let count = 0

class User extends Mocker {
  constructor () {
    super()
    let i = count++
    this._id = ObjectId()
    this.name = `name${i}`
    this.accessToken = 'some accessToken'
  }
}

module.exports = User
