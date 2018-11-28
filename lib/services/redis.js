const config = require('config')
const redis = require('thunk-redis')
module.exports = redis.createClient(config.REDIS)
