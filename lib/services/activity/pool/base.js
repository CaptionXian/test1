const _ = require('lodash')
const Activity = require('../')

const allActions = []

class BaseActivity {
  get objectType () {
    return 'base'
  }

  static get _actions () {
    return allActions
  }

  constructor () {
    this.actions = {}
    this.registerActions()
  }

  registerActions () {
    throw new Error('registerActions require override')
  }

  // validate 函数作用
  // 1. 用于校验 content 有效性, 防止传入非法的 content
  // 2. 过滤无用的字段, 避免 content 存在无用的字段(脏数据)
  registerAction (actions, validate) {
    if (!_.isArray(actions)) {
      actions = [actions]
    }

    if (!_.isFunction(validate)) {
      throw new Error(
        `validate method required for action ${this.objectType}.${actions}`
      )
    }

    for (let action of actions) {
      if (this.actions[`${this.objectType}.${action}`]) {
        throw new Error(
          `action ${this.objectType}.${action} already registered`
        )
      }
      this.actions[`${this.objectType}.${action}`] = { validate }
      BaseActivity._actions.push(`${this.objectType}.${action}`)
    }
  }

  async createAction (_creatorId, action, boundId, content) {
    if (!this.actions[`${this.objectType}.${action}`]) {
      throw new Error(`${this.objectType}: action ${action} not registered`)
    }

    const _content = this.actions[`${this.objectType}.${action}`].validate(
      content
    )
    
    if (_content === false) {
      throw new Error(
        `invalid content for action ${
          this.objectType
        }.${action} ${JSON.stringify(content)}`
      )
    }

    await Activity.new({
      action,
      _creatorId,
      boundToObjects: [
        {
          objectType: this.objectType,
          _objectId: boundId
        }
      ],
      content: _content
    })
  }
}

module.exports = BaseActivity
