const _ = require('lodash')
const twsOrg = require('../../services/tws-org')
const validFields = [
  '_id',
  'action',
  'rawAction',
  '_creatorId',
  'content',
  'created',
  'updated',
  '_boundToObjectId',
  'boundToObjectType',
  'creator'
]

class Formatter {
  clearFields (activity) {
    const keys = Object.keys(activity)
    for (let key of keys) {
      if (!validFields.includes(key)) {
        delete activity[key]
      }
    }

    const actions = ['activity']
    actions.push(activity.boundToObjectType)

    actions.push(activity.action.replace(/_/g, '.'))
    activity.action = actions.join('.')
    if (!activity.content) {
      activity.content = {}
    }
    activity.content.creator = activity.creator.name
  }

  async format (activity, options = {}) {
    activity._boundToObjectId = _.result(
      activity,
      'boundToObjects[0]._objectId'
    )
    activity.boundToObjectType = _.result(
      activity,
      'boundToObjects[0].objectType'
    )

    delete activity.boundToObjects

    if (!activity._boundToObjectId) {
      return
    }
    activity.rawAction = activity.action

    const { _organizationId } = options
    await this.getCreator(activity, _organizationId)
  }

  async getCreator (activity, _organizationId) {
    let defaultCreator = {
      _id: '',
      name: '',
      email: '',
      avatarUrl: ''
    }

    const user = await twsOrg.getUserInOrg(
      _organizationId,
      activity._creatorId,
      ['email']
    )
    activity.creator = user || defaultCreator

    this.clearFields(activity)
  }
}

module.exports = new Formatter()
