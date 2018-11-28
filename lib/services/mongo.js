const config = require('config')
const mongoose = require('mongoose')
const schemas = require('../models')(mongoose.Schema)
mongoose.Promise = Promise

let dbOptions = { useNewUrlParser: true }

mongoose.connect(config.MONGODB.URL, dbOptions)

const db = {
  activity: mongoose.model('activity',schemas.Activity),
  okrassociation: mongoose.model('okrassociation',schemas.Okrassociation),
  okrcomment: mongoose.model('okrcomment',schemas.Okrcomment),
  okrconnection: mongoose.model('okrconnection',schemas.Okrconnection),
  okrgradingstandard: mongoose.model('okrgradingstandard',schemas.Okrgradingstandard),
  okrobjective: mongoose.model('okrobjective',schemas.Okrobjective),
  okrperiod: mongoose.model('okrperiod',schemas.Okrperiod),
  okrprogress: mongoose.model('okrprogresse',schemas.Okrprogress),
  okrremind: mongoose.model('okrremind',schemas.Okrremind),
  okrsuperadmin: mongoose.model('okrsuperadmin',schemas.Okrsuperadmin),
  permission: mongoose.model('permission',schemas.Permission),
  preference: mongoose.model('preference',schemas.Preference)
}

module.exports = db