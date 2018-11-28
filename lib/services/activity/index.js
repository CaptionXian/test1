const db = require('../../services/mongo')

const activityBus = exports

activityBus.new = async function (data) {
  return db.activity.create(data)
}
