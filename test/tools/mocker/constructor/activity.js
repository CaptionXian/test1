'use strict'

const Mocker = require('../mocker')
var count = 0

class Activity extends Mocker {
  constructor () {
    super()
    let i = count++
    this._creatorId = Mocker.Types.ObjectId()
    this.content = {
      attachments: [],
      content: `activity content ${i}`,
      mentions: {}
    }
  }
}

module.exports = Activity
