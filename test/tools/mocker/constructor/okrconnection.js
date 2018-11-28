'use strict'

const ObjectId = require('mongoose').Types.ObjectId
const Mocker = require('../mocker')
let count = 0

class Okrconnection extends Mocker {
  constructor () {
    super()
    let i = count++
    this._organizationId = ObjectId()
    this._fromId = ObjectId()
    this._toId = ObjectId()
    this.note = `okrconnection${i}`
    this._creatorId = ObjectId()
  }
}

module.exports = Okrconnection
