'use strict'

const fs = require('fs')
const path = require('path')
const ObjectId = require('mongoose').Types.ObjectId

const dirPath = path.join(__dirname, 'constructor')

exports.constructors = []
fs.readdirSync(dirPath).forEach(file => {
  let Constructor = require(`${dirPath}/${file}`)
  let name = Constructor.name
  let nameLower = Constructor.name.toLowerCase()
  exports.constructors.push(name)
  if (exports[name]) throw new Error(`${name} exist!`)

  exports[nameLower] = function (obj) {
    let data = new Constructor()
    if (obj) {
      Object.keys(obj).map(key => {
        data.set(key, obj[key])
      })
    }

    Object.keys(data).map(key => {
      if (ObjectId.isValid(data[key])) {
        data.set(key, `${data[key]}`)
      }
    })

    return data
  }
})
