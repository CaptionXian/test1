'use strict'

const ObjectId = require('mongoose').Types.ObjectId
const Mocker = require('../mocker')
let count = 0

class Okrobjective extends Mocker {
  constructor () {
    super()
    let i = count++
    let _userId = ObjectId()
    this.title = `okrobjective${i}`
    this.progress = 0
    this._organizationId = ObjectId()
    this.boundToObjectType = 'member'
    this._boundToObjectId = _userId
    this._executorId = _userId
    this._creatorId = ObjectId()
  }
}

module.exports = Okrobjective
