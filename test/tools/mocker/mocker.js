'use strict'

const crypto = require('crypto')
const mongoose = require('mongoose')

class Mocker {}
Object.defineProperty(Mocker.prototype, 'get', {
  value: function (key) {
    return this[key]
  }
})
Object.defineProperty(Mocker.prototype, 'set', {
  value: function (key, value) {
    this[key] = value
  }
})

Mocker.Types = mongoose.Types
Mocker.hash = function (str, algorithm) {
  if (typeof str !== 'string') throw new Error(`${String(str)} must be string`)
  algorithm = algorithm || 'sha256'
  return crypto
    .createHash(algorithm)
    .update(str)
    .digest('hex')
}

module.exports = Mocker
