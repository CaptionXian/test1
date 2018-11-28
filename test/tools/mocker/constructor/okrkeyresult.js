'use strict'

const ObjectId = require('mongoose').Types.ObjectId
const Mocker = require('../mocker')
let count = 0

class Okrkeyresult extends Mocker {
  constructor () {
    super()
    let i = count++
    this.title = `okrkeyresult${i}`
    this.progress = 0
    this._okrObjectiveId = ObjectId()
    this._creatorId = ObjectId()
    this.measure = {}
  }
}

module.exports = Okrkeyresult
