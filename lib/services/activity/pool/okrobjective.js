const _ = require('lodash')
const mask = require('json-mask')
const BaseActivity = require('./base')

class OkrobjectiveActivity extends BaseActivity {
  get objectType () {
    return 'okrobjective'
  }

  registerActions () {
    let actions = [
      'create',
      'update.title',
      'kr.create',
      'kr.update.measure.boolean',
      'kr.update.measure.percentage',
      'kr.update.measure.objective',
      'kr.update.measure.task',
      'kr.update.measure.keyresult',
      'kr.update.progress.boolean.true',
      'kr.update.progress.boolean.false',
      'kr.update.suspend',
      'kr.update.resume',
      'kr.delete',
      'update.measure.boolean',
      'update.measure.percentage',
      'update.progress.boolean.true',
      'update.progress.boolean.false',
    ]
    this.registerAction(actions, function (content) {
      content = mask(content, 'title')
      if (!_.isString(content.title)) {
        return false
      }
      return content
    })

    actions = ['update.progress']
    this.registerAction(actions, function (content) {
      content = mask(content, 'progress')
      if (!_.isNumber(content.progress)) {
        return false
      }
      return content
    })

    actions = ['update.executor']
    this.registerAction(actions, function (content) {
      content = mask(content, 'executor')
      if (!_.isString(content.executor)) {
        return false
      }
      return content
    })

    actions = ['update.okrperiod']
    this.registerAction(actions, function (content) {
      content = mask(content, 'okrperiod')
      if (!_.isString(content.okrperiod)) {
        return false
      }
      return content
    })
    
    actions = ['update.ancestor']
    this.registerAction(actions, function (content) {
      content = mask(content, 'ancestor')
      if (!_.isString(content.ancestor)) {
        return false
      }
      return content
    })
    
    actions = ['update.score']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,score')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isNumber(content.score)) {
        return false
      }
      return content
    })
    
    actions = ['update.gradingStandard']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title')
      if (!_.isString(content.title)) {
        return false
      }
      return content
    })

    actions = ['delete.gradingStandard']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title')
      if (!_.isString(content.title)) {
        return false
      }
      return content
    })

    actions = ['update.objectiveLabel']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,objectiveLabel')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isString(content.objectiveLabel)) {
        return false
      }
      switch (content.objectiveLabel) {
        case 'objective': 
          content.objectiveLabel = '目标'
          break
        case 'keyresult':
          content.objectiveLabel = '关键结果'
          break
        case 'kpi':
          content.objectiveLabel = 'KPI'
          break
      }
      return content
    })

    actions = ['update.measure.numeric']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,measure')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isObject(content.measure)) {
        return false
      }
      if (!_.isString(content.measure.unit)) {
        return false
      }
      if (!_.isNumber(content.measure.initial)) {
        return false
      }
      if (!_.isNumber(content.measure.target)) {
        return false
      }
      return content
    })

    actions = ['update.progress.percentage']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,progress')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isNumber(content.progress)) {
        return false
      }
      return content
    })

    actions = ['update.progress.numeric']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,measure')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isString(content.measure.unit)) {
        return false
      }
      if (!_.isNumber(content.measure.current)) {
        return false
      }
      return content
    })

    actions = [
      'clear.ancestor',
      'update.type.organization',
      'update.type.team',
      'update.type.personal',
      'update.suspend',
      'update.resume'
    ]
    this.registerAction(actions, content =>
      // no need param
      ({})
    )

    actions = ['kr.update.title']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,oldTitle')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isString(content.oldTitle)) {
        return false
      }
      return content
    })

    actions = ['kr.update.measure.numeric']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,measure')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isObject(content.measure)) {
        return false
      }
      if (!_.isString(content.measure.unit)) {
        return false
      }
      if (!_.isNumber(content.measure.initial)) {
        return false
      }
      if (!_.isNumber(content.measure.target)) {
        return false
      }
      return content
    })

    actions = ['kr.update.progress.percentage']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,progress')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isNumber(content.progress)) {
        return false
      }
      return content
    })

    actions = ['kr.update.progress.numeric']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,measure')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isString(content.measure.unit)) {
        return false
      }
      if (!_.isNumber(content.measure.current)) {
        return false
      }
      return content
    })

    actions = ['kr.update.weight']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,weight')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isNumber(content.weight)) {
        return false
      }
      return content
    })

    actions = ['kr.update.gradingStandard']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title')
      if (!_.isString(content.title)) {
        return false
      }
      return content
    })

    actions = ['kr.update.score']
    this.registerAction(actions, function (content) {
      content = mask(content, 'title,score')
      if (!_.isString(content.title)) {
        return false
      }
      if (!_.isNumber(content.score)) {
        return false
      }
      return content
    })

    actions = ['update.association.dataweight']
    return this.registerAction(actions, function (content) {
      content = mask(content, 'objectiveTitle,associationTitle,associationType,dataWeight')
      if (!_.isString(content.objectiveTitle)) {
        return false
      }
      if (!_.isString(content.associationTitle)) {
        return false
      }
      if (!_.isString(content.associationType)) {
        return false
      }
      if (!_.isNumber(content.dataWeight)) {
        return false
      }
      return content
    })
  }
}

module.exports = new OkrobjectiveActivity()
