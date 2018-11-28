'use strict'

const ObjectId = require('mongoose').Types.ObjectId
const Mocker = require('../mocker')
let count = 0

class Okrperiod extends Mocker {
  constructor () {
    super()
    let i = count++
    this.name = `okrperiod${i}`
    this.startDate = new Date()
    this.endDate = new Date(60 * 60 * 1000 + this.startDate.getTime()) // 一天以后
    this._organizationId = ObjectId()
    this._creatorId = ObjectId()
  }
}

module.exports = Okrperiod
