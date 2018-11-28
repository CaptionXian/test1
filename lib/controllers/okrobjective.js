const _ = require('lodash')
const db = require('../services/mongo')
const { createErr } = require('http-errors')
const validator = require('validator')
const ObjectId = require('mongoose').Types.ObjectId
const { jsonify, activity, constant } = require('../utils')
const twsOrg = require('../services/tws-org')
const permission = require('../middlewares/permission')
const okrperiodCtrl = require('./okrperiod')
const { Base } = require('./base')
const config = require('config')
const axios = require('../utils/axios')
const excel = require('../utils/excel')


const ActivityPool = require('../services/activity/pool')

class OkrobjectiveCtrl extends Base {
  async validateParentId (okrobjective, _parentId) {
    // _parentId 可以为 null
    if (_parentId === null) {
      return true
    }

    // _parentId 必须为 mongoId
    if (!validator.isMongoId(_parentId)) {
      return false
    }

    // _parentId 不能为当前目标自身
    if (`${_parentId}` === `${okrobjective._id}`) {
      return false
    }

    // _parentId 必须为当前企业的目标
    const parent = await db.okrobjective.findOne({
      _organizationId: okrobjective._organizationId,
      _id: _parentId,
      isDeleted: false
    })
    if (!parent) {
      return false
    }
    // _parentId 不能为当前目标的子树节点, mongoose 封装过的 indexOf 函数可直接比较 ObjectId
    if (parent.ancestorIds.indexOf(`${okrobjective._id}`) > -1) {
      return false
    }
    return true
  }

  /**
   * 创建/更新目标
   * 检查 boundToObjectType 和 _boundToObjectId
   * - 创建目标时，为必填项
   * - 更新目标时，若未改类型
   *  - 若未提供 boundToObjectType 参数, 视为不修改目标类型，则 skip
   */
  async validateBoundToObject (ctx, isUpdate) {
    const { okrobjective } = ctx.state
    let {
      _organizationId,
      boundToObjectType,
      _boundToObjectId,
      _executorId
    } = ctx.state.params

    if (isUpdate && !okrobjective) throw createErr('ParamError')

    // 更新操作, 且未提供 boundToObjectType 时, 视为不更新此两属性, skip
    if (isUpdate && !boundToObjectType) {
      Object.assign(
        ctx.state.params,
        _.pick(okrobjective, ['_boundToObjectId', 'boundToObjectType'])
      )
      return
    }

    // 更新操作时, _organizationId 为 okrobjective 的_organizationId
    if (isUpdate && !_organizationId) {
      _organizationId = okrobjective._organizationId
    }

    // 若无 _organizationId, 则报错
    if (!_organizationId) throw createErr('ParamError', '_organizationId')

    // 类型合法性验证
    if (!['organization', 'team', 'member'].includes(boundToObjectType)) {
      throw createErr('ParamError', 'boundToObjectType')
    }

    // 团队目标时, 团队合法性验证
    if (boundToObjectType === 'team') {
      if (!_boundToObjectId) {
        throw createErr('ParamError', '_boundToObjectId')
      }
      let team = await twsOrg.getTeamInOrgById(
        _organizationId,
        _boundToObjectId
      )
      if (!team) throw createErr('ParamError', '_boundToObjectId')
    } else if (boundToObjectType === 'organization') {
      Object.assign(ctx.state.params, {
        _boundToObjectId: _organizationId
      })
    } else if (boundToObjectType === 'member') {
      // 个人目标时, _boundToObjectId 为目标负责人ID
      Object.assign(ctx.state.params, {
        _boundToObjectId: _executorId
      })
    }
  }

  async createOkrobjective (data) {
    let ancestorIds
    const { _organizationId, _parentId } = data

    // 检查企业目标数量限制 500
    const okrobjectiveCount = await db.okrobjective.count({
      _organizationId
    })
    if (okrobjectiveCount >= 10000) {
      throw createErr('ExceedLimit')
    }

    //  如果有关联的话，measure 为空
    if( !_.isEmpty(data.tasks) || !_.isEmpty(data.objectives) ) {
      data.measure = {}
    }

    // 生成 ancestorIds
    if (_parentId) {
      const parent = await db.okrobjective.findById(_parentId)

      // 检查企业目标层级上限 9 层
      if (parent.ancestorIds.length >= 8) {
        throw createErr('ExceedLimit')
      }

      ancestorIds = _.clone(parent.ancestorIds)
      ancestorIds.unshift(_parentId)
      data.ancestorIds = ancestorIds
      //  更新所有上级目标的 measure 
      for(let ancestor of ancestorIds){
        let parObjective = await db.okrobjective.findOne({ _id: ancestor, isDeleted: false })
        parObjective.measure = {}
        await parObjective.save()
      }
    } else {
      data.ancestorIds = []
    }

    return db.okrobjective.create(data)
  }

  // okrobjective 返回数据附加 executor: { _id, name, avatarUrl, status }
  async setExecutor (ctx, _organizationId) {
    let result = ctx.body
    if (!Array.isArray(result)) {
      result = [result]
    }
    for (let okrobjective of result) {
      var status
      if (!okrobjective._executorId) {
        continue
      }

      // get executor
      let executor = await twsOrg.getUserInOrg(
        _organizationId,
        okrobjective._executorId
      )
      if (!executor) {
        status = 'quited'
      } else if (executor.isDisabled) {
        status = 'disabled'
      } else {
        status = 'in'
      }
      okrobjective.executor = Object.assign({}, executor, {
        status
      })
    }
  }

  //  计算当前目标的 progerss
  async getProgress(okrobjective, user) {
    if(okrobjective.measure && ['boolean', 'percentage', 'numeric'].includes(okrobjective.measure.mode)) {
      if (okrobjective.measure.target === okrobjective.measure.initial || okrobjective.measure.current > okrobjective.measure.target) {
        return 100
      }
      if (okrobjective.measure.current < okrobjective.measure.initial || okrobjective.measure.target < okrobjective.measure.initial) {
        return 0
      }
      okrobjective.progress =  Math.round((okrobjective.measure.current - okrobjective.measure.initial) / (okrobjective.measure.target - okrobjective.measure.initial) * 100)
    } else {
      const oldProgress = okrobjective.progress
      const associationIds = await this.findByObjectiveId({ _okrObjectiveId: okrobjective._id, isDeleted : false })
      let current = 0
      let totalWeight = _.sum(associationIds.map(val => val.dataWeight))
      const childrens = await db.okrobjective.find({
        'ancestorIds.0': okrobjective._id,
        isDeleted: false
      })
      totalWeight += _.sum(childrens.map(val => val.weight))
      for(let association of associationIds) {
        switch (association.type) {
          case 'task': {
            try {
              const taskResult = await axios.axios_get(config.CORE.HOST + '/tasks/' + association._associationId, user.token)
            let task = taskResult.data
            task.dataWeight = association.dataWeight
            if (task.isDone) current += (task.dataWeight / totalWeight) * 100
            } catch (error) {
              console.log("error", error)
            }
            break
          }
          case 'objective': {
            let objective = await db.okrobjective.findOne({ _id: association._associationId }).lean()
            objective.dataWeight = association.dataWeight
            objective.progress = (await this.getProgress(objective, user)).progress
            current += (objective.dataWeight / totalWeight) * objective.progress
            break
          }
        }
      }
      
      for(let children of childrens) {
        children.progress = (await this.getProgress(children, user)).progress
        current += (children.weight / totalWeight) * children.progress
      }
      okrobjective.progress = Math.round(current)

      //  进度变化记录
      if(oldProgress !== okrobjective.progress) {
        const data = {
          'oldProgress': oldProgress,
          'newProgress': okrobjective.progress,
          '_okrObjectiveId': okrobjective._id,
          '_creatorId': user._id 
        }
        await db.okrprogress.create(data)
      }
    }

    await db.okrobjective.update({ _id: okrobjective._id }, { $set: { progress: okrobjective.progress }})
    return okrobjective
  }

  // 返回更新 okrobjectives 数据的 Progress
  async setMeanProgress (ctx) {
    const { user } = ctx.state
    let result = ctx.body
    if (!Array.isArray(result)) {
      result = [ctx.body]
    }
    for (let okrobjective of result) {
      okrobjective = okrobjective.toJSON ? okrobjective.toJSON() : okrobjective
      await this.getProgress(okrobjective, user)
    }
  }

  async getOkrPermissions (_organizationId) {
    let permissions = await db.permission.find({
      _organizationId
    })
    if (_.isEmpty(permissions)) {
      permissions =  {
        'get' : constant.DEFAULT_GET_OKR_PERMISSIONS,
        'create' : constant.DEFAULT_CREATE_OKR_PERMISSIONS,
        'update' : constant.DEFAULT_UPDATE_OKR_PERMISSIONS,
        'grade' : constant.DEFAULT_GRADE_OKR_PERMISSIONS,
        'other' : constant.DEFAULT_OTHER_OKR_PERMISSIONS
      }

      const actionArr = ['get', 'create', 'update', 'grade','other']
      for(let action of actionArr) {
        const data = {
          _organizationId,
          action,
          permissions: permissions[action]
        }
        await db.permission.create(data)
      }

      return permissions
    }
    
    let result = {}
    for(let permission of permissions){
      switch (permission.action) {
        case 'get' : {
          result = {
            'get' : permission.permissions
          }
          break
        }
        case 'create' : {
          result = _.set(result, 'create', permission.permissions)
          break
        }
        case 'update' : {
          result = _.set(result, 'update', permission.permissions)
          break
        }
        case 'grade' : {
          result = _.set(result, 'grade', permission.permissions)
          break
        }
        case 'other' : {
          result = _.set(result, 'other', permission.permissions)
          break
        }
      }
    }
    return result
  }

  //  获取企业对应操作的权限
  async getOkrActionPermission (_organizationId, action) {
    let permissions = await db.permission.findOne({
      _organizationId,
      action
    })
    return permissions.permissions
  }

  // 初始化默认权限
  async initOkrPermissions (_organizationId, action) {
    let permissions
    switch (action) {
      case 'get' : {
        permissions = constant.DEFAULT_GET_OKR_PERMISSIONS
        break
      }
      case 'create' : {
        permissions = constant.DEFAULT_CREATE_OKR_PERMISSIONS
        break
      }
      case 'update' : {
        permissions = constant.DEFAULT_UPDATE_OKR_PERMISSIONS
        break
      }
      case 'grade' : {
        permissions = constant.DEFAULT_GRADE_OKR_PERMISSIONS
        break
      }
      case 'other' : {
        permissions = constant.DEFAULT_OTHER_OKR_PERMISSIONS
        break
      }
    }
    return db.permission.findOneAndUpdate(
      {
        _organizationId,
        action
      },
      {
        permissions: permissions
      },
      { upsert: true, new: true }
    )
  }

  async batchAddOkrPermissions (_organizationId, boundToObjectType, toAdd, action) {
    if (!toAdd.length) {
      return
    }
    if (!['organization', 'team', 'member', 'update', 'grade', 'restart'].includes(boundToObjectType)) {
      return
    }
    for (let item of toAdd) {
      if (!constant.ENUM_PERMISSIONS[boundToObjectType].includes(item)) {
        return
      }
    }

    await this.getPreferenceByOrganizationId(_organizationId, action)

    // 更新
    let conds = {
      $addToSet: {
        [`permissions.${boundToObjectType}`]: {
          $each: toAdd
        }
      },
      updated: new Date()
    }

    await db.permission.findOneAndUpdate(
      {
        _organizationId,
        action
      },
      conds
    )
  }

  async getPreferenceByOrganizationId (_organizationId, action) {
    let permissions = await db.permission.findOne({
      _organizationId,
      action
    })

    if (!permissions) {
      permissions = await this.initOkrPermissions(_organizationId, action)
    }
    return permissions
  }

  async batchDelOkrPermissions (_organizationId, boundToObjectType, toDel, action) {
    if (!toDel.length) {
      return
    }

    await this.getPreferenceByOrganizationId(_organizationId, action)

    // 更新
    let conds = {
      $pullAll: {
        [`permissions.${boundToObjectType}`]: toDel
      },
      updated: new Date()
    }
    await db.permission.findOneAndUpdate(
      {
        _organizationId,
        action
      },
      conds
    )
  }

  async hasOkrPermission (
    _userId,
    _organizationId,
    boundToObjectType,
    _boundToObjectId,
    _executorId,
    type,
    action
  ) {
    // 是否 企业成员 或 应用管理员 角色
    let orgRole
    let orgMember = await twsOrg.getUserInOrg(_organizationId, _userId, [
      'role',
      '_roleId'
    ])
    if(orgMember) {
      orgRole = 'member'
    }

    const superAdmin = await db.okrsuperadmin.find({ _userId: orgMember._id })
    if(superAdmin) {
      orgRole = 'superAdmin'
    }

    // 获取部门角色: 部门负责人, 部门成员
    let isTeamMember = false
    let isTeamLeader = false
    let isExecutor = false
    if (boundToObjectType === 'team') {
      isTeamLeader = await twsOrg.isTeamLeader(
        _organizationId,
        _userId,
        _boundToObjectId
      )
      isTeamMember = await twsOrg.isTeamMember(
        _organizationId,
        _userId,
        _boundToObjectId
      )
    }

    const teams = await twsOrg.getTeamsByOrgAndUser(_organizationId, _userId)
    for(let team of teams) {
      if(_userId === team._leaderId){
        isTeamLeader = true
      }
    }

    if(_executorId === _userId)isExecutor = true

    // 获取应用权限白名单
    let permissions = await this.getOkrPermissions(_organizationId)
    let allowedRoles
    if(boundToObjectType){
      allowedRoles = permissions[type][boundToObjectType]
    }else{
      allowedRoles = permissions[type]['member']
    }

    if((type === 'update' || type === 'other') && action){
      allowedRoles = permissions[type][action]
    }

    // 判断权限
    return (
      allowedRoles.includes('member') ||
      (allowedRoles.includes('superAdmin') && orgRole === 'superAdmin') ||
      (allowedRoles.includes('teamMember') && isTeamMember) ||
      (allowedRoles.includes('teamLeader') && isTeamLeader) ||
      (allowedRoles.includes('executor') && isExecutor)
    )
  }

  // 校验目标操作权限
  async validateOkrPermission (ctx, type, action='') {
    const { user, okrobjective } = ctx.state
    let {
      _organizationId,
      boundToObjectType,
      _boundToObjectId
    } = ctx.state.params
    let _executorId

    if(okrobjective){
      _organizationId = okrobjective._organizationId
      boundToObjectType = okrobjective.boundToObjectType
      _boundToObjectId = okrobjective._boundToObjectId
      _executorId = okrobjective._executorId
    }

    const pass = await this.hasOkrPermission(
      user._id,
      _organizationId,
      boundToObjectType,
      _boundToObjectId,
      _executorId,
      type,
      action
    )

    if (!pass) {
      throw createErr('NoPermission')
    }
  }

  /*
    目标统计
    @return:
      { count, progress, meanProgress }
      目标数量 count, 目标进度平均值 progress, 目标(关键结果加权平均)进度平均值 meanProgress
  */
  async statistic (conds) {
    let result = {
      count: 0,
      progress: 0,
      meanProgress: 0
    }

    // step 1: get 'count' and 'progress' of all
    let countAndProgressList = await this.aggregateCountAndProgress(conds, null)

    if (countAndProgressList.length) {
      result.count = countAndProgressList[0].count
      result.progress = Math.round(countAndProgressList[0].progress)
    }

    // step 2: get 'meanProgress' of all
    let meanProgressList = await this.aggregateMeanProgress(conds, null)
    if (meanProgressList.length) {
      result.meanProgress = Math.round(meanProgressList[0].meanProgress)
    }

    return result
  }

  /*
    企业部门 目标统计列表
    @return:
      [{
        _id,  部门id
        count,  目标数量
        progress,  目标进度平均值
        meanProgress  目标(关键结果加权平均)进度平均值
      }]
  */
  async statisticForTeams (conds) {
    let resultMap = new Map()

    // step 1: get 'count' and 'progress' groupBy '_boundToObjectId' (namely _teamId)
    let countAndProgressList = await this.aggregateCountAndProgress(
      conds,
      '_boundToObjectId'
    )

    if (countAndProgressList.length) {
      resultMap = new Map(
        countAndProgressList.map(item => {
          return [
            `${item._id}`,
            _.assign(item, {
              meanProgress: 0
            })
          ]
        })
      )
    }

    // step 2: get 'meanProgress' groupBy '_boundToObjectId' (namely _teamId)
    let meanProgressList = await this.aggregateMeanProgress(
      conds,
      '_boundToObjectId'
    )

    if (meanProgressList.length) {
      for (let item of meanProgressList) {
        if (!resultMap.get(`${item._id}`)) continue
        resultMap.get(`${item._id}`).meanProgress = item.meanProgress
      }
    }

    return Array.from(resultMap.values())
  }

  /*
    企业部门成员 目标统计列表
    @return:
      [{
        _id,  用户id
        count,  目标数量
        progress,  目标进度平均值
        meanProgress  目标(关键结果加权平均)进度平均值
      }]
  */
  async statisticForTeamMembers (conds) {
    let resultMap = new Map()

    // step 1: get 'count' and 'progress' groupBy '_executorId' (namely _userId)
    let countAndProgressList = await this.aggregateCountAndProgress(
      conds,
      '_executorId'
    )

    // 补全无目标的数据
    for (let _executorId of conds._executorId.$in) {
      let exist = _.find(countAndProgressList, function (ele) {
        return `${ele._id}` === `${_executorId}`
      })
      if (!exist) {
        countAndProgressList.push({
          _id: _executorId,
          progress: 0,
          count: 0
        })
      }
    }

    if (countAndProgressList.length) {
      resultMap = new Map(
        countAndProgressList.map(item => {
          // 设置默认的 meanProgress 为 0
          return [
            `${item._id}`,
            _.assign(item, {
              meanProgress: 0
            })
          ]
        })
      )
    }

    conds._executorId.$in[0] = ObjectId(conds._executorId.$in[0])

    // step 2: get 'meanProgress' groupBy '_executorId' (namely _userId)
    let meanProgressList = await this.aggregateMeanProgress(
      conds,
      '_executorId'
    )

    // 设置 meanProgress
    if (meanProgressList.length) {
      for (let item of meanProgressList) {
        if (resultMap.get(`${item._id}`)) {
          resultMap.get(`${item._id}`).meanProgress = item.meanProgress
        }
      }
    }

    return Array.from(resultMap.values())
  }

  // 对象的值转 ObjectId
  mapValueToObjectId (obj) {
    for (let key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && validator.isMongoId(obj[key])) {
        obj[key] = ObjectId(obj[key])
      }
    }
    return obj
  }

  /*
    获取目标 count, progress 统计
    @param:
      conds 数据库目标查询条件,
      field 分组的类别(有效值: null, '_boundToObjectId', '_executorId')
    @return:
      [{ _id: _fieldId, count: 5, progress: 60 }]
  */
  async aggregateCountAndProgress (conds, field) {
    // 转 ObjectId, aggregate 操作不会自动转换格式
    conds = this.mapValueToObjectId(conds)
    /* 数据库中的函数 */
    let result = []
    let aggregateResult = await db.okrobjective.aggregate([{ $match : conds}, { $group : { _id : null, count : { $sum : 1 }, avg: { $avg : "$progress" }}}])
    // 下面有目标的情况下才处理
    for (let ele of aggregateResult) {
      result.push({
        _id: ele._id,
        count: ele.count,
        progress: ele.avg
      })
    }

    return result
  }

  async removeNode (okrObjective) {
    // 删除所有子树节点
    await db.okrobjective.update(
      {
        ancestorIds: okrObjective._id,
        isDeleted: false
      },
      {
        isDeleted: true,
        updated: new Date()
      },
      {
        multi: true
      }
    )

    // 删除关联
    await db.okrassociation.update(
      {
        _associationId: okrObjective._id,
        isDeleted: false
      },
      {
        isDeleted: true,
        updated: new Date()
      },
      {
        multi: true
      }
    )

    // 删除自身
    okrObjective.isDeleted = true
    okrObjective.update = new Date()
    await okrObjective.save()
  }
  /*
    获取目标关键结果加权平均进度 统计
    @param:
      conds 数据库目标查询条件,
      field 分组的类别(有效值: null, '_boundToObjectId', '_executorId')
    @return:
      [{ _id: _fieldId, meanProgress: 80 }]
  */
  async aggregateMeanProgress (conds, field) {
    // 转 ObjectId, aggregate 操作不会自动转换格式
    conds = this.mapValueToObjectId(conds)
    let _okrObjectiveIds = await db.okrobjective.distinct('_id', conds).exec()

    // Array [{ _id 目标分组类型id => count 对应的目标数量 }]
    let fieldCounts = await db.okrobjective
      .aggregate([
        {
          $match: conds
        },
        {
          $group: {
            _id: field ? `$${field}` : null,
            count: {
              $sum: 1
            }
          }
        }
      ])
      .exec()
    /*
      fieldMap 数据结构: (field 为 null 时, 只有一个元素)
      {
        _fieldId: {
          _id       // 即 _fieldId
          count     // _fieldId 对应目标数量
          meanProgressList: []   // 含有关键结果的目标的平均进度值列表(关键结果加权平均)
          meanProgress: 0        // _fieldId 的目标平均进度
        },
        ...
      }
    */
    let fieldMap = new Map()
    for (let item of fieldCounts) {
      let _fieldId = field === null ? null : `${item._id}`
      fieldMap.set(
        _fieldId,
        _.assign(item, {
          meanProgressList: [],
          meanProgress: 0
        })
      )
    }

    let pipeline = [
      {
        $match: {
          isSuspended: {
            $ne: true
          }, // 排除已中止的关键结果
          isDeleted: false,
          _okrObjectiveId: {
            $in: _okrObjectiveIds
          }
        }
      },
      {
        // 根据关键结果的 _okrObjectiveId 匹配出 目标数组(注意这里是长度为 1 的数组类型, 没办法!)
        $lookup: {
          from: 'okrobjectives',
          localField: '_okrObjectiveId',
          foreignField: '_id',
          as: 'okrObjective'
        }
      },
      {
        // 从 目标数组 中解构出(第一个且唯一的) 目标对象
        $unwind: '$okrObjective'
      },
      {
        // 按 目标id 分组, 算出 totalWeight 和 totalProgressMultiplyWeight
        $group: {
          _id: '$_okrObjectiveId',
          totalWeight: {
            $sum: '$weight'
          },
          totalProgressMultiplyWeight: {
            $sum: {
              $multiply: ['$progress', '$weight']
            }
          },
          _executorId: {
            $first: '$okrObjective._executorId'
          }, // 目标 _executorId
          _boundToObjectId: {
            $first: '$okrObjective._boundToObjectId'
          } // 目标 _boundToObjectId
        }
      }
    ]
    /*
      aggregation 数据结构为:
      [{
        _id,  // 目标id
        totalWeight,
        totalProgressMultiplyWeight,
        _executorId,
        _boundToObjectId
      }]
    */
    let aggregation = await db.okrkeyresult.aggregate(pipeline).exec()
    // 计算并填充 meanProgressList
    for (let okrItem of aggregation) {
      let _fieldId = field === null ? null : `${okrItem[field]}`
      let item = fieldMap.get(_fieldId)
      if (item) {
        item.meanProgressList.push(
          okrItem.totalProgressMultiplyWeight / okrItem.totalWeight
        )
      }
    }
    // 计算 meanProgress
    for (let item of fieldMap.values()) {
      // 特别注意! 这里除以 count, 而不是 meanProgressList.length
      item.meanProgress = _.sum(item.meanProgressList) / item.count
    }

    return Array.from(fieldMap.values())
  }

  // 创建目标更新动态
  async createUpdateOkrobjectiveActivity (user, okrobjective, oldOkrobjective) {
    const fields = [
      'title',
      // 'progress',
      '_executorId',
      '_okrPeriodId',
      'ancestorIds',
      'isSuspended',
      'score',
      'gradingStandard',
      'objectiveLabel',
      'measure.mode',
      'measure.current'
    ]

    for (let field of fields) {
      var action, content
      if ((okrobjective.measure && oldOkrobjective.measure) && field.startsWith('measure.')) {
        const measureField = field.split('measure.')[1]
        if (
          _.isEqual(
            okrobjective.measure[measureField],
            oldOkrobjective.measure[measureField]
          )
        ) {
          continue
        }
      } else {
        if (_.isEqual(okrobjective[field], oldOkrobjective[field])) {
          continue
        } // 过滤掉未改动的字段
      }    
      switch (field) {
        case 'title':
          action = 'update.title'
          content = {
            title: okrobjective.title
          }
          break

        // case 'progress':
        //   action = 'update.progress'
        //   content = {
        //     progress: okrobjective.progress
        //   }
        //   break

        case '_executorId':
          action = 'update.executor'
          const executor = await twsOrg.getUserInOrg(
            okrobjective._organizationId,
            okrobjective._executorId
          )
          content = {
            executor: executor.name
          }
          break

        case '_okrPeriodId':
          action = 'update.okrperiod'
          const okrperiod = await db.okrperiod.findById(
            okrobjective._okrPeriodId
          )
          content = {
            okrperiod: _.result(okrperiod, 'name') || ''
          }
          break

        case 'ancestorIds':
          const ancestor = await db.okrobjective.findById(
            okrobjective.ancestorIds[0]
          )
          if (ancestor) {
            action = 'update.ancestor'
            content = {
              ancestor: ancestor.title
            }
          } else {
            action = 'clear.ancestor'
            content = {}
          }
          break

        case 'isSuspended':
          if (okrobjective.isSuspended) {
            action = 'update.suspend'
          } else {
            action = 'update.resume'
          }
          content = {}
          break

        case 'score': //  更新目标评分
          action = 'update.score'
          content = _.pick(okrobjective, ['title', 'score'])
          content.score = Number(content.score)
          break

        case 'gradingStandard': //  更新目标评分标准
          action = 'update.gradingStandard'
          content = { title: okrobjective.title }
          break

        case 'objectiveLabel': //  更新目标等级
          action = 'update.objectiveLabel'
          content = _.pick(okrobjective, ['title', 'objectiveLabel'])
          break

        // 更新 'mode', 'unit', 'initial', 'target' 属于同一个动态
        case 'measure.mode': // 更新衡量单位
          action = `update.measure.${okrobjective.measure.mode}`
          content = _.pick(okrobjective, ['title', 'measure'])
          break

        case 'measure.current': // 更新完成度
          switch (okrobjective.measure.mode) {
            case 'boolean':
              if (
                okrobjective.measure.current === okrobjective.measure.target
              ) {
                action = 'update.progress.boolean.true'
              } else {
                action = 'update.progress.boolean.false'
              }
              break
            case 'percentage':
              action = 'update.progress.percentage'
              break
            case 'numeric':
              action = 'update.progress.numeric'
              break
          }
          content = _.pick(okrobjective, ['title', 'measure', 'progress'])
          break
      }

      if (!action || !content) {
        return
      }
  
      await ActivityPool.okrobjective.createAction(
        user._id,
        action,
        okrobjective._id,
        content
      )
    }
  }

  async createOkrobjectiveAPI (ctx, next) {
    await this.validateBoundToObject(ctx)
    // await this.validateOkrPermission(ctx, "create")
    const { user } = ctx.state
    const {
      _organizationId,
      title,
      progress,
      boundToObjectType,
      _boundToObjectId,
      _executorId,
      _okrPeriodId,
      _parentId,
      objectiveLabel,
      weight,
      measure,
      objectives,
      tasks,
      children
    } = ctx.state.params

    if(measure){
      //  检验 measure
      await this.validatMeasure(measure)
    }
    
    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    // 检查 _executorId 为企业成员
    if (_executorId) {
      const executor = await twsOrg.getUserInOrg(_organizationId, _executorId)
      if (!executor) {
        throw createErr('ParamError', '_executorId')
      }
    }

    // 检查 _okrPeriodId 为有效企业周期
    if (_okrPeriodId) {
      const okrperiod = await db.okrperiod.findOne({
        isDeleted: false,
        _organizationId,
        _id: _okrPeriodId
      })
      if (!okrperiod) {
        throw createErr('ParamError', '_okrPeriodId')
      }
    }

    // 检查 _parentId 为有效企业目标
    if (_parentId) {
      const ancestor = await db.okrobjective.findOne({
        isDeleted: false,
        _organizationId,
        _id: _parentId
      })
      if (!ancestor) {
        throw createErr('ParamError', '_parentId')
      }
    }

    // 检查目标级别， 目标，关键结果，KPI
    if (!['objective', 'keyresult', 'KPI'].includes(objectiveLabel)) {
      throw createErr('ParamError', 'objectiveLabel')
    }

    const data = {
      title,
      progress,
      boundToObjectType,
      _boundToObjectId,
      _executorId,
      _okrPeriodId,
      _parentId,
      _organizationId,
      _creatorId: user._id,
      objectiveLabel,
      weight,
      measure,
      objectives,
      tasks
    }
    const okrobjective = await this.createOkrobjective(data)

    //  START 如果关联了任务（目标），记录关联信息
    const assocition = {} //  关联对象
    if ( objectives ) {
      assocition.type = 'objective'
      assocition._okrObjectiveId = okrobjective._id
      assocition._creatorId = okrobjective._creatorId
      for (let associationId of objectives) {
        assocition._associationId = associationId
        assocition.dataWeight =  5
        await db.okrassociation.create(assocition)
      }
    }
    if ( tasks ) {
      assocition.type = 'task'
      assocition._okrObjectiveId = okrobjective._id
      assocition._creatorId = okrobjective._creatorId
      for (let associationId of tasks) {
        assocition._associationId = associationId
        assocition.dataWeight =  5
        await db.okrassociation.create(assocition)
      }
    }
    //  END
    
    //  创建子目标
    if(!_.isEmpty(children)) {
      for(let childrenMsg of children) {
        childrenMsg._parentId = okrobjective._id
        childrenMsg._creatorId = okrobjective._creatorId
        childrenMsg._organizationId = okrobjective._organizationId
        await this.createOkrobjective(childrenMsg)
      }
    }

    ctx.body = okrobjective

    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      this.setWithChildren(ctx)
    ]).catch((error) => {
      console.log(error)
    })
    
    this.emit('inhouse.okrobjective.create', ctx)
  }

  //  关键结果返回带关联信息
  async setWithAssociation (ctx) {
    const { user } = ctx.state
    let okrobjectives = ctx.body
    if (!Array.isArray(okrobjectives)) {
      okrobjectives = Array(okrobjectives)
    }

    for (let okrobjective of okrobjectives) {
      const conds = { _okrObjectiveId: okrobjective._id, isDeleted: false }
      const associationIds = await this.findByObjectiveId(conds)
      let tasks = []
      let objectives  = []
      for(let association of associationIds){
        switch (association.type) {
          case 'task': {
            try {
              const taskResult = await axios.axios_get(config.CORE.HOST + '/tasks/' + association._associationId, user.token)
              let task = taskResult.data
              task.dataWeight = association.dataWeight
              tasks.push(task) 
            } catch (error) {
              console.log("error", error)
            }
            break
          }
          case 'objective': {
            let objective = await db.okrobjective.findOne({ _id: association._associationId }).lean()
            const children = await db.okrobjective.find({
              'ancestorIds.0': objective._id,
              isDeleted: false
            })
            children.length > 0 ? objective.hasChildren = true : objective.hasChildren = false
            objective.dataWeight = association.dataWeight
            await this.getObjectiveMsg(objective, user)
            objectives.push(objective)
            break
          }
        }
      }
      okrobjective.tasks = tasks
      okrobjective.objectives = objectives
      //  关联它的目标
      const beAssociation = _.uniq(await this.findBeAssociation(okrobjective._id))
      okrobjective.beAssociations = beAssociation
    }
    return okrobjectives
  }

  async findBeAssociation (_okrObjectiveId) {
    let beAssociation = []
    const associations = await db.okrassociation.find({ _associationId: _okrObjectiveId, isDeleted: false }, { _okrObjectiveId: 1 })
    for(let association of associations) {
      beAssociation.push((association._okrObjectiveId).toString())
      const resutl = await this.findBeAssociation(association._okrObjectiveId)
      beAssociation = _.concat(beAssociation, resutl)
    }
    return beAssociation
  }

  async findByObjectiveId (conds) {
    return db.okrassociation.find(conds)
  }

  //  查找关联的权重
  async findDataWeightByConds (conds) {
    const result = await db.okrassociation.findOne(conds, { dataWeight: 1 })
    return result.dataWeight
  }

  // 更新目标的 measure, 并计算更新 progress
  async updateObjectiveMeasure (objective, changes) {
    let result = await db.okrobjective.findOne({ _id: objective._id })
    _.assign(result.measure, changes)
    this.validatMeasure(result.measure) // 在合并已有数据和参数后, 校验完整数据
    result.progress = this.calculateProgress(result.measure)
    result.updated = new Date()
    return await result.save()
  }

  // 计算 kr 的进度值
  // 参数为 measure 中的初始值, 当前值, 目标值, 必须已经过校验
  calculateProgress ({ initial, current, target }) {
    if (target === initial || current > target) {
      return 100
    }
    if (current < initial || target < initial) {
      return 0
    }
    return Math.round(((current - initial) / (target - initial)) * 100)
  }

  //  获取关联的目标信息
  async getObjectiveMsg (objectives, user) {
    if (!Array.isArray(objectives)) {
      objectives = Array(objectives)
    }
    for (let objective of objectives) {
      const userMsg = await twsOrg.getUserInOrg(
        objective._organizationId,
        objective._executorId
      )
      objective.executor = userMsg
      objective.typeMsg = await this.getObjectTypeMsg(
        user.token,
        objective.boundToObjectType,
        objective._boundToObjectId,
        objective._organizationId
      )
      objective.progress = (await this.getProgress(objective, user)).progress
    }
    return objectives
  }

  //  获取 boundToObjectType 的信息
  async getObjectTypeMsg (token, type, _id, _organizationId) {
    //  type 为三种：成员，团队，企业
    if (type === 'team') {
      //  获取团队信息
      const ret = await axios.axios_get(
        `${config.CORE.HOST}/v2/teams/${_id}`,
        token
      )
      return ret.data
    } else if (type === 'organization') {
      //  获取企业信息
      const ret = await axios.axios_get(
        `${config.CORE.HOST}/organizations/${_id}`,
        token
      )
      return ret.data
    } else {
      // 获取个人信息
      const ret = await twsOrg.getUserInOrg(
        _organizationId,
        _id
      )
      return ret
    }
  }

  //  获取任务是否完成
  async taskResult (token, taskId) {
    try {
      return axios.axios_get(config.CORE.HOST + '/tasks/' + taskId, token)
    } catch (error) {
      console.log("error",error)
    }   
  }

  //  目标返回带评分标准
  async setWithGradingStandard (ctx) {
    let results = ctx.body
    if (!Array.isArray(results)) {
      results = Array(results)
    }
    for (let objective of results) {
      objective.gradingStandard = await db.okrgradingstandard.findOne({
        _okrLinkId: objective._id
      })
      if (!objective.gradingStandard) {
        objective.gradingStandard = await db.okrgradingstandard.findOne({
          _okrLinkId: objective._okrPeriodId
        })
      } 
      if (!objective.gradingStandard) {
        objective.gradingStandard = await db.okrgradingstandard.findOne({
          _organizationId: objective._organizationId,
          standardType: 0
        })
      } 
      if (!objective.gradingStandard) {
        objective.gradingStandard = {
          gradingStandards: config.GRADINGSTANDARD,
          standardType: 0,
          _organizationId: objective._organizationId,
        }
      } 
    }
  }

  //  目标返回带第一级子目标
  async setWithChildren (ctx) {
    let results = ctx.body
    if (!Array.isArray(results)) {
      results = Array(results)
    }
    for (let objective of results) {
      // if(objective.ancestorIds.length === 0){
        let children = await db.okrobjective.find({
          'ancestorIds.0': objective._id,
          isDeleted: false
        }).lean()
        for(let subObjective of children) {
          // get executor
          let executor = await twsOrg.getUserInOrg(
            subObjective._organizationId,
            subObjective._executorId
          )
          let status
          if (!executor) {
            status = 'quited'
          } else if (executor.isDisabled) {
            status = 'disabled'
          } else {
            status = 'in'
          }
          subObjective.executor = Object.assign({}, executor, {
            status
          })
        }
        objective.subObjective = children
      // }
    }
  }

  async getOkrobjectiveAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'get')
    const { user } = ctx.state
    const {
      _organizationId,
      boundToObjectType,
      _boundToObjectId,
      _executorId,
      _okrPeriodId,
      _parentId,
      objectiveLabel
    } = ctx.state.params

    // await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const conds = _.omitBy(
      {
        _organizationId,
        boundToObjectType,
        _boundToObjectId,
        _executorId,
        _okrPeriodId,
        isDeleted: false,
        objectiveLabel
      },
      _.isUndefined
    )

    if (_parentId || _parentId === null) {
      conds['ancestorIds.0'] = _parentId
    }

    // if(!_okrPeriodId) {
    //   conds['_okrPeriodId'] = await db.okrperiod.findOne({_organizationId, isDeleted: false})._id
    // }

    ctx.body = await db.okrobjective.find(conds)

    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      twsOrg.userInfosComplement(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      this.setWithChildren(ctx),
      this.setWithProgressLog(ctx)
    ]).catch((error) => {
      console.log(error)
    })
  }

  //  获取简洁的目标（不带卷积计算和项目负责人等）
  async getSimpleOkrobjectiveAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'get')
    const { user } = ctx.state
    let {
      _organizationId,
      boundToObjectType,
      _boundToObjectId,
      _executorId,
      _okrPeriodId,
      _parentId //  父级目标
      // _okrObjectiveId    //  自身目标
    } = ctx.state.params

    // await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const conds = _.omitBy(
      {
        _organizationId,
        boundToObjectType,
        _boundToObjectId,
        _executorId,
        _okrPeriodId,
        isDeleted: false
      },
      _.isUndefined
    )

    ctx.body = await db.okrobjective.find(conds).limit(1000)

    await jsonify(ctx)
  }

  // 更新节点及所有子孙节点的 ancestorIds
  async updateAncestorByParentId (okrobjective, _parentId) {
    let ancestorIds
    if (!(await this.validateParentId(okrobjective, _parentId))) {
      throw Error('bad _parentId')
    }

    if (_parentId) {
      const parent = await db.okrobjective.findById(_parentId)
      ancestorIds = _.clone(parent.ancestorIds)
      ancestorIds.unshift(parent._id)
    } else {
      ancestorIds = []
    }
    await this.updateAncestorIds(okrobjective, ancestorIds)
  }

  // 更新节点及所有子树节点的 ancestorIds
  async updateAncestorIds (okrobjective, ancestorIds) {
    okrobjective.ancestorIds = ancestorIds
    await okrobjective.save()

    const children = await db.okrobjective.find({
      'ancestorIds.0': okrobjective._id,
      isDeleted: false
    })
    for (let child of children) {
      ancestorIds = _.clone(okrobjective.ancestorIds)
      ancestorIds.unshift(okrobjective._id)
      await this.updateAncestorIds(child, ancestorIds)
    }
  }

  async getOkrActiviesById (_boundToObjectId, options = {}) {
    const conds = { 'boundToObjects._objectId': _boundToObjectId }
    const { minDate, maxDate } = options
    let { limit } = options

    if (minDate != null || maxDate != null) {
      conds.created = {}
      if (minDate != null) {
        conds.created.$gt = minDate
      }
      if (maxDate != null) {
        conds.created.$lt = maxDate
      }
    }

    let query = db.activity
      .find(conds)
      .limit(1000)
      .sort({ created: -1 })

    if (limit) {
      limit = parseInt(limit)
    }
    if (limit != null) {
      query = query.limit(limit)
    }
    return query.exec()
  }

  async updateOkrobjectiveAPI (ctx, next) {
    await this.validateBoundToObject(ctx, true)
    // await this.validateOkrPermission(ctx, 'update', 'update')
    const { user, okrobjective } = ctx.state
    const {
      title,
      progress,
      _executorId,
      _okrPeriodId,
      _parentId,
      _boundToObjectId,
      boundToObjectType,
      objectiveLabel,
      weight
    } = ctx.state.params
    const { _organizationId } = okrobjective

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    // 检查 _executorId 为企业成员
    if (_executorId) {
      const executor = await twsOrg.getUserInOrg(_organizationId, _executorId)
      if (!executor) {
        throw createErr('ParamError', '_executorId')
      }
    }

    // 检查 _okrPeriodId 为有效企业周期
    if (_okrPeriodId) {
      const okrperiod = await db.okrperiod.findOne({
        _organizationId: _organizationId,
        _id: _okrPeriodId
      })
      if (!okrperiod) {
        throw createErr('ParamError', '_okrPeriodId')
      }
    }

    // 单独更新 ancestorIds, 参数 _parentId 只是为了更新 ancestorIds 的便捷方式.
    if (_parentId || _parentId === null) {
      if (!(await this.validateParentId(okrobjective, _parentId))) {
        throw createErr('ParamError', '_parentId')
      }
      await this.updateAncestorByParentId(okrobjective, _parentId)
    }

    // 检查目标级别， 目标，关键结果，KPI
    if (objectiveLabel && !['objective', 'keyresult', 'KPI'].includes(objectiveLabel)) {
      throw createErr('ParamError', 'objectiveLabel')
    }

    // 更新其他字段
    const changes = _.omitBy(
      {
        title,
        progress,
        _executorId,
        _okrPeriodId,
        boundToObjectType,
        _boundToObjectId,
        updated: new Date(),
        objectiveLabel,
        weight
      },
      _.isUndefined
    )
    _.assign(okrobjective, changes)
    
    if (okrobjective.boundToObjectType === 'member') {
      okrobjective._boundToObjectId = okrobjective._executorId
    }

    await okrobjective.save()

    ctx.body = okrobjective

    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      twsOrg.userInfosComplement(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      // this.setWithChildren(ctx),
      this.setWithProgressLog(ctx)
    ]).catch((error) => {
      console.log(error)
    })

    this.emit('inhouse.okrobjective.update', ctx)
  }

  async updateOkrobjectiveSuspendAPI (ctx, next) {
    const { okrobjective, user } = ctx.state
    const { relatedUserIds, note } = ctx.state.params
    const { _organizationId } = okrobjective

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    // relatedUserIds 是有效企业成员用户id
    let relatedUsers = await twsOrg.getMembersInOrg(
      _organizationId,
      relatedUserIds
    )

    if (relatedUsers.length !== relatedUserIds.length) {
      throw createErr('ParamError', 'relatedUserIds')
    }

    // 更新目标
    let changes = {
      isSuspended: true,
      relatedUserIds,
      note,
      updated: new Date()
    }
    Object.assign(okrobjective, changes)
    await okrobjective.save()
    ctx.body = okrobjective

    this.emit('inhouse.okrobjective.update', ctx)
  }
  
  async updateOkrobjectiveRestartAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'other', 'restart')
    const { okrobjective, user } = ctx.state
    const { _organizationId } = okrobjective

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    // 更新目标
    let changes = {
      isDone: false,
      updated: new Date()
    }
    Object.assign(okrobjective, changes)
    await okrobjective.save()
    ctx.body = okrobjective

    await jsonify(ctx)
    await this.setExecutor(ctx, _organizationId)
    await twsOrg.userInfosComplement(ctx, _organizationId)

    this.emit('inhouse.okrobjective.update', ctx)
  }

  async updateOkrobjectiveResumeAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'other', 'restart')
    const { okrobjective, user } = ctx.state
    const { _organizationId } = okrobjective

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    // 更新目标
    let changes = {
      isSuspended: false,
      updated: new Date()
    }
    Object.assign(okrobjective, changes)
    await okrobjective.save()
    ctx.body = okrobjective

    await jsonify(ctx)
    await this.setExecutor(ctx, _organizationId)
    await twsOrg.userInfosComplement(ctx, _organizationId)

    this.emit('inhouse.okrobjective.update', ctx)
  }

  async deleteOkrobjectiveAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'update', 'update')
    const { okrobjective, user } = ctx.state
    const { _organizationId } = okrobjective

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    await this.removeNode(okrobjective)
    ctx.body = okrobjective
  }

  async updateokrProgressModeAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId, okrProgressMode } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let preference = await this.getPreferenceByOrganizationId(_organizationId)

    const changes = {
      okrProgressMode,
      updated: new Date()
    }
    Object.assign(preference, changes)
    await preference.save()

    ctx.body = _.pick(preference, [
      '_id',
      'okrProgressMode',
      'updated',
      '_organizationId'
    ])
  }

  async getOkrobjectivePermissionsAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    ctx.body = await this.getOkrPermissions(_organizationId)
  }

  async updateOkrobjectivePermissionsAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId, boundToObjectType, action, $add, $del } = ctx.state.params

    if (_.isEmpty($add) && _.isEmpty($del)) {
      throw createErr('ParamError', '$add or $del required')
    }

    if (!action || !_.includes(['get', 'create', 'update', 'grade', 'other'],action)) {
      throw createErr('ParamError', 'action')
    }

    await permission.isOrganizationMember(ctx, _organizationId, user._id)
    await this.isSuperAdmin(ctx, _organizationId, user._id)

    if (!_.isEmpty($add)) {
      await this.batchAddOkrPermissions(
        _organizationId,
        boundToObjectType,
        $add,
        action
      )
    }
    if (!_.isEmpty($del)) {
      await this.batchDelOkrPermissions(
        _organizationId,
        boundToObjectType,
        $del,
        action
      )
    }

    let permissions = await this.getOkrActionPermission(_organizationId, action)
    ctx.body = {
      action,
      [boundToObjectType]: permissions[boundToObjectType]
    }
  }

  async isSuperAdmin (ctx, _organizationId, _userId) {
    if (!_organizationId) {
      throw createErr('NoPermission')
    }

    const superAdmin = await db.okrsuperadmin.findOne({
      _organizationId,
      _userId,
      isDeleted: false
    })
    if(!superAdmin){
      throw createErr('NoPermission')
    }
  }

  /**
   * 获取目标统计, 根据参数筛选条件 返回合并统计结果
   * - 参数
   *  - *_organizationId: 企业 ID
   *  - boundToObjectType: 目标类型, organization, team, member, 默认企业
   *  - _boundToObjectId: 用户ID或部门ID, boundToObjectType 为 organization 时，可不提供
   *  - _okrPeriodId: 周期ID, 若存在，则忽略 startDate & endDate
   *  - _executorId: 负责人ID
   *  - startDate: 起始时间
   *  - endDate: 结束时间
   *
   * - 返回
   *  {
   *    count: '总数',
   *    progress: '进度平均值(不包含中止目标)',
   *    meanProgress: '目标KR进度平均值(不包含中止目标)'
   *  }
   */
  async getOkrobjectiveStatisticAPI (ctx, next) {
    const { user } = ctx.state

    let {
      _organizationId,
      boundToObjectType,
      _boundToObjectId,
      _executorId,
      _okrPeriodId,
      startDate,
      endDate
    } = ctx.state.params
    let conds = _.omitBy(
      {
        _organizationId,
        boundToObjectType,
        _boundToObjectId,
        _executorId,
        _okrPeriodId,
        isSuspended: {
          $ne: true
        },
        isDeleted: false
      },
      _.isUndefined
    )

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    // 参数 startDate, endDate 必须同时使用; 如果指定了参数 _okrPeriodId, 则优先使用.
    if (startDate && endDate && !_okrPeriodId) {
      let periodIds = await okrperiodCtrl.findPeriodIds(
        _organizationId,
        startDate,
        endDate
      )
      conds._okrPeriodId = {
        $in: periodIds
      }
    }

    ctx.body = await this.statistic(conds)
  }

  // 获取目标统计, 返回部门目标的统计结果列表
  async getOkrobjectiveTeamStatisticAPI (ctx, next) {
    const { user } = ctx.state
    const {
      _organizationId,
      _okrPeriodId,
      startDate,
      endDate,
      joined
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let conds = _.omitBy(
      {
        _organizationId,
        _okrPeriodId,
        boundToObjectType: 'team',
        isSuspended: {
          $ne: true
        },
        isDeleted: false
      },
      _.isUndefined
    )
    // 参数 startDate, endDate 必须同时使用; 如果指定了参数 _okrPeriodId, 则优先使用.
    if (startDate && endDate && !_okrPeriodId) {
      let periodIds = await okrperiodCtrl.findPeriodIds(
        _organizationId,
        startDate,
        endDate
      )
      conds._okrPeriodId = {
        $in: periodIds
      }
    }

    // 参数 joined 过滤我所加入的部门
    if (joined) {
      let joinedOrgTeams = await twsOrg.getTeamsByOrgAndUser(
        _organizationId,
        user._id
      )

      let joinedOrgTeamIds = joinedOrgTeams.map(item => item._id)
      conds._boundToObjectId = {
        $in: joinedOrgTeamIds
      }
    }

    let aggregation = await this.statisticForTeams(conds)

    // 返回结果 附加字段 team: { _id, name }
    let teams = await twsOrg.getTeamsByOrganizationId(_organizationId)
    let teamsMap = new Map(
      teams.map(team => [`${team._id}`, _.pick(team, ['_id', 'name'])])
    )

    let result = aggregation.map(item => ({
      team: teamsMap.get(`${item._id}`),
      count: item.count,
      progress: Math.round(item.progress),
      meanProgress: Math.round(item.meanProgress)
    }))
    ctx.body = result
  }

  // 获取目标统计, 返回部门所有成员目标的统计结果列表
  async getOkrobjectiveTeamMembersStatisticAPI (ctx, next) {
    const { user } = ctx.state
    const {
      _okrPeriodId,
      _organizationId,
      _teamId,
      endDate,
      startDate
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const team = await twsOrg.getTeamInOrg(_organizationId, _teamId)

    if (!team) {
      throw createErr('ParamError', '_teamId')
    }

    // 读取本部门直属的 '企业成员'
    let teamMembers = await twsOrg.getDirectOrgMembersInTeam(
      _organizationId,
      _teamId
    )

    let teamMemberUserIds = teamMembers.map(member => ObjectId(member._userId))
    let conds = _.omitBy(
      {
        _organizationId,
        _okrPeriodId,
        _executorId: {
          $in: teamMemberUserIds
        },
        isSuspended: {
          $ne: true
        },
        isDeleted: false
      },
      _.isUndefined
    )

    // 参数 startDate, endDate 必须同时使用; 如果指定了参数 _okrPeriodId, 则优先使用.
    if (startDate && endDate && !_okrPeriodId) {
      let periodIds = await okrperiodCtrl.findPeriodIds(
        _organizationId,
        startDate,
        endDate
      )
      conds._okrPeriodId = {
        $in: periodIds
      }
    }

    let aggregation = await this.statisticForTeamMembers(conds)

    // 返回结果 附加字段 user: { _id, name, avatarUrl }
    let usersMap = new Map()

    for (let member of teamMembers) {
      let userInfo = twsOrg.getBasicInfo(member)
      usersMap.set(member._userId, userInfo)
    }

    let result = aggregation.map(item => {
      return {
        user: usersMap.get(`${item._id}`),
        count: item.count,
        progress: Math.round(item.progress),
        meanProgress: Math.round(item.meanProgress)
      }
    })
    ctx.body = result
  }

  // 获取 okr 调整记录动态
  async getOkrobjectivesActiviesAPI (ctx, next) {
    const { user, okrobjective } = ctx.state
    const { _okrObjectiveId } = ctx.state.params
    const { _organizationId } = okrobjective

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    ctx.body = await this.getOkrActiviesById(_okrObjectiveId)

    await jsonify(ctx)
    await activity.activityTitleTransform(ctx, _organizationId)
  }

  //  更新目标得分
  async getOkrobjectiveGradeAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'grade')
    const { user, okrobjective } = ctx.state
    const { score, resultSummary } = ctx.state.params
    const { _organizationId } = okrobjective

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    //  emit 事件中调用
    ctx.state.old = okrobjective.toJSON()

    let changes = {
      score: score,
      resultSummary: resultSummary,
      updated: new Date(),
      isDone: true
    }

    _.assign(okrobjective, changes)

    await okrobjective.save()
    ctx.body = okrobjective
    
    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx)
    ]).catch((error) => {
      console.log(error)
    })

    //  调整记录
    this.emit('inhouse.okrobjective.update', ctx)
  }

  //  查找目标
  async findByConds (conds) {
    return db.okrobjective.find(conds)
  }

  //  查找目标
  async findObjectiveByConds (conds, count = 1000) {
    return db.okrobjective
      .find(conds)
      .limit(count)
      .lean()
  }

  //  提醒
  async remindExector (periods, objectiveType, remindType) {
    if (!Array.isArray(periods)) {
      periods = [periods]
    }

    for (let period of periods) {
      const objectives = await this.findByConds({
        isDeleted: false,
        boundToObjectType: objectiveType,
        _okrPeriodId: period
      })
      let remindMsg = []
      objectives.map(val => {
        remindMsg.push([val._executorId, val.title, val._organizationId])
      })

      // remindMsg.map( val => {

      // })
    }
  }

  // 校验 measure 中的数据
  validatMeasure (measure) {
    const {
      mode = 'percentage',
      initial = 0,
      target = 100,
      current = 0,
      unit = ''
    } = measure
    
    if (
      ![
        'boolean',
        'percentage',
        'numeric'
      ].includes(mode)
    ) {
      throw createErr('ParamError', 'mode')
    }
    if (unit.length > 10) {
      throw createErr('ParamError', 'unit maxLength 10')
    }
    if (initial >= target) {
      throw createErr('ParamError', 'expect initial < target')
    }
    if (initial > current || current > target) {
      throw createErr('ParamError', 'expect initial <= current <= target')
    }
    return true
  }

  // 校验 gradingStandard 中的数据
  validatGradingStandard (gradingStandard) {
    const {
      firstGradingScore = 30,
      firstGradingDescribe = '',
      secondGradingScore = 70,
      secondGradingDescribe = '',
      thirdGradingScore = 100,
      thirdGradingDescribe = ''
    } = gradingStandard

    if (firstGradingDescribe.length > 500) {
      throw createErr('ParamError', 'firstGradingDescribe maxLength 500')
    }
    if (secondGradingDescribe.length > 500) {
      throw createErr('ParamError', 'secondGradingDescribe maxLength 500')
    }
    if (thirdGradingDescribe.length > 500) {
      throw createErr('ParamError', 'thirdGradingDescribe maxLength 500')
    }
    if (
      firstGradingScore > secondGradingScore ||
      secondGradingScore > thirdGradingScore
    ) {
      throw createErr(
        'ParamError',
        'expect firstGradingScore <= secondGradingScore <= thirdGradingScore'
      )
    }
    return true
  }

  //  更改目标的 measure
  async updateOkrObjectiveMeasureAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'update', 'update')
    const { user, okrobjective } = ctx.state
    const {
      mode,
      initial,
      target,
      current,
      unit
    } = ctx.state.params
    const { _organizationId } = okrobjective
    const oldProgress = okrobjective.progress

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const changes = _.omitBy(
      {
        mode,
        initial,
        target,
        current,
        unit
      },
      _.isUndefined
    )

    _.assign(okrobjective.measure, changes)
    this.validatMeasure(okrobjective.measure) // 在合并已有数据和参数后, 校验完整数据
    okrobjective.progress = this.calculateProgress(okrobjective.measure)
    okrobjective.updated = new Date()

    if(oldProgress !== okrobjective.progress) {
      const data = {
        'oldProgress': oldProgress,
        'newProgress': okrobjective.progress,
        '_okrObjectiveId': okrobjective._id,
        '_creatorId': user._id
      }
      await db.okrprogress.create(data)
    }

    ctx.body = await okrobjective.save()
    
    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      twsOrg.userInfosComplement(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      // this.setWithChildren(ctx),
      this.setWithProgressLog(ctx)
    ]).catch((error) => {
      console.log(error)
    })

    this.emit('inhouse.okrobjective.update', ctx)
  }

  //  新增关联信息
  async updateOkrObjectiveAssociationAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'update', 'update')
    const { user, okrobjective } = ctx.state
    const { _organizationId } = okrobjective
    const {
      objectives,
      tasks
    } = ctx.state.params

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    //  START 如果关联了任务（目标），记录关联信息
    const assocition = {} //  关联对象
    if (objectives) {
      assocition.type = 'objective'
      assocition._okrObjectiveId = okrobjective._id
      assocition._creatorId = okrobjective._creatorId
      for (let associationId of objectives) {
        assocition._associationId = associationId
        assocition.dataWeight = 5
        await db.okrassociation.create(assocition)
      }
    }
    if (tasks) {
      assocition.type = 'task'
      assocition._okrObjectiveId = okrobjective._id
      assocition._creatorId = okrobjective._creatorId
      for (let associationId of tasks) {
        assocition._associationId = associationId
        assocition.dataWeight = 5
        await db.okrassociation.create(assocition)
      }
    }
    //  END

    okrobjective.updated = new Date()
    okrobjective.measure = {}
    ctx.body = await okrobjective.save()

    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      twsOrg.userInfosComplement(ctx, _organizationId)
    ]).catch((error) => {
      console.log(error)
    })

    this.emit('inhouse.okrobjective.update', ctx)
  }

  async deleteOkrObjectiveAssociationAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'update', 'update')
    const { user, okrobjective } = ctx.state
    const { _organizationId } = okrobjective
    const { _associationId } = ctx.state.params

    // emit 事件中使用
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const updateData = {
        isDeleted: true,
        updated: new Date()
      }

    await db.okrassociation.update(
      {
        _associationId: _associationId,
        _okrObjectiveId: okrobjective._id,
        isDeleted: false
      },
      updateData
    )

    okrobjective.updated = new Date()
    ctx.body = await okrobjective.save()

    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      twsOrg.userInfosComplement(ctx, _organizationId)
    ]).catch((error) => {
      console.log(error)
    })

    this.emit('inhouse.okrobjective.update', ctx)
  }

  //  修改评分标准
  async updateOkrobjectiveGradingStandardAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'update', 'grade')
    const { user, okrobjective } = ctx.state
    const { gradingStandards } = ctx.state.params
    const { _organizationId } = okrobjective

    // emit 事件中使用
    okrobjective.gradingStandard = {}
    ctx.state.old = okrobjective.toJSON()

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    for (let gradingStandard of gradingStandards) {
      const oldGradingStandards = await db.okrgradingstandard.findOne({
        _id: gradingStandard._id
      })
      let changes = {
        score: gradingStandard.score,
        describe: gradingStandard.describe,
        updated: new Date()
      }
      Object.assign(oldGradingStandards, changes)
      await oldGradingStandards.save()
    }

    ctx.body = okrobjective
    await jsonify(ctx)
    await this.setWithGradingStandard(ctx)
    await twsOrg.userInfosComplement(ctx, _organizationId)

    this.emit('inhouse.okrobjective.update', ctx)
  }

  //  更改关联信息（关联的目标或任务，子目标）的权重
  async updateOkrobjectiveWeightAPI (ctx, next) {
    // await this.validateOkrPermission(ctx, 'update', 'update')
    const { user, okrobjective } = ctx.state
    const { _associationId, dataWeight, type } = ctx.state.params
    const { _organizationId } = okrobjective

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    if(!['children', 'association'].includes(type)) {
      throw createErr('ParamError', 'type')
    }

    if( type === 'association') {
      const okrassociation = await db.okrassociation.findOne({
        _associationId,
        _okrObjectiveId: okrobjective._id
      })
  
      if(_.isEmpty(okrassociation)) {
        throw createErr('ParamError', '_associationId')
      }

      ctx.state.old = okrassociation //  emit 事件调用
      const changes = _.omitBy(
        {
          dataWeight,
          updated: new Date()
        },
        _.isUndefined
      )
      Object.assign(okrassociation, changes)
      await okrassociation.save()
      ctx.state.okrassociation = okrassociation //  emit 事件调用

    } else {
      const children = await db.okrobjective.findOne({ _id: _associationId, 'ancestorIds.0': okrobjective._id, isDeleted: false })
      if(_.isEmpty(children)) {
        throw createErr('ParamError', '_associationId')
      }

      ctx.state.old = children //  emit 事件调用
      const changes = _.omitBy(
        {
          weight: dataWeight,
          updated: new Date()
        },
        _.isUndefined
      )
      Object.assign(children, changes)
      await children.save()
      ctx.state.okrassociation = children //  emit 事件调用

    }
    
    ctx.body = okrobjective

    await jsonify(ctx)
    await Promise.all([
      this.setExecutor(ctx, _organizationId),
      twsOrg.userInfosComplement(ctx, _organizationId),
      this.setWithAssociation(ctx),
      this.setWithGradingStandard(ctx),
      this.setMeanProgress(ctx),
      this.setWithChildren(ctx),
      this.setWithProgressLog(ctx)
    ]).catch((error) => {
      console.log(error)
    })

    this.emit('update.association.dataweight', ctx)
  }

  //  获取进度更新记录
  async setWithProgressLog(ctx) {
    let okrobjectives = ctx.body
    if (!Array.isArray(okrobjectives)) {
      okrobjectives = Array(okrobjectives)
    }

    for(let objective of okrobjectives) {
      objective.progressLog = await db.okrprogress.find({
        _okrObjectiveId: objective._id
      })
    }
  }

  //  获取周期动态
  async getOkrPeriodActiviesAPI(ctx, next) {
    const { user, okrperiod } = ctx.state

    await permission.isOrganizationMember(
      ctx,
      okrperiod._organizationId,
      user._id
    )

    const conds = { '_okrPeriodId' : okrperiod._id }
    const objectives = await db.okrobjective.find(conds).lean()
    let activitys = []
    for(let objective of objectives) {
      const activity = await this.getOkrActiviesById(objective._id)
      activitys.push(activity)
    }
    ctx.body = _.flattenDeep(activitys)
    await activity.activityTitleTransform(ctx, okrperiod._organizationId)
  }

  //  导出结束周期数据
  async exportOkrperiodDataAPI (ctx, next) {
    const { user, okrperiod } = ctx.state

    await permission.isOrganizationAdminOrOwner(
      ctx,
      okrperiod._organizationId,
      user._id
    )

    const _headers = [
      {
        caption: '目标',
        type: 'string',
        width: 20
      },
      {
        caption: '完成进度(%)',
        type: 'number',
        width: 20
      },
      {
        caption: '目标级别',
        type: 'string',
        width: 20
      },
      {
        caption: '所属团队',
        type: 'string',
        width: 20
      },
      {
        caption: '目标负责人',
        type: 'string',
        width: 20
      },
      {
        caption: '目标类型',
        type: 'string',
        width: 20
      },
      {
        caption: '目标评分',
        type: 'number',
        width: 20
      }
    ]

    let rows = await this.objectiveData(
      { _okrPeriodId: okrperiod._id, isDeleted: false },
      user
    )

    const result = await excel.exportExcel(_headers, rows)
    const data = new Buffer(result, 'binary')
    ctx.set('Content-Type', 'application/vnd.openxmlformats;charset=utf8')
    ctx.body = data
  }

  async objectiveData (conds, user) {
    let data = []
    let excelData = []
    let objectiveData = await db.okrobjective
      .find(conds, {
        title: 1,
        boundToObjectType: 1,
        _boundToObjectId: 1,
        objectiveLabel: 1,
        score: 1,
        _executorId: 1,
        _organizationId: 1
      }).lean()
    
    objectiveData = await this.getObjectiveMsg(objectiveData,user)
    
    for (let objective of objectiveData) {
      data.push(objective.title)
      data.push(objective.progress)

      switch (objective.boundToObjectType) {
        case 'organization':
          objective.boundToObjectType = '企业目标'
          objective.team = ''
          break
        case 'team':
          objective.boundToObjectType = '团队目标'
          objective.team = objective.typeMsg.name
          break
        default:
          objective.boundToObjectType = '个人目标'
          objective.team = ''
          break
      }

      switch (objective.objectiveLabel) {
        case 'objective':
          objective.objectiveLabel = '目标'
          break
        case 'keyresult':
          objective.objectiveLabel = '关键结果'
          break
        default:
          objective.objectiveLabel = 'KPI'
          break
      }
      data.push(objective.boundToObjectType)
      data.push(objective.team)
      data.push(objective.executor.name)
      data.push(objective.objectiveLabel)
      data.push(objective.score)
      excelData.push(data)
      data = []
    }
    return excelData
  }
}

module.exports = new OkrobjectiveCtrl()
