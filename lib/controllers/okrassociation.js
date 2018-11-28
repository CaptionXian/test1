const { Base } = require('./base')
const axios = require('../utils/axios')
const jsonify = require('../utils/jsonify')
const db = require('../services/mongo')
const config = require('config')
const permission = require('../middlewares/permission')
const okrobjectiveCtrl = require('./okrobjective')
const ActivityPool = require('../services/activity/pool')
const ObjectId = require('mongoose').Types.ObjectId
const _ = require('lodash')

class OkrassociationCtrl extends Base {
  //  获取项目
  async getProjectsByOrgIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const projects = await axios.axios_get(
      `${config.CORE.HOST}/organizations/${_organizationId}/projects/all`,
      user.token
    )

    ctx.body = projects.data
  }

  //  获取任务列表
  async getTasklistsByProjectIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _projectId } = ctx.state.params

    const tasklists = await axios.axios_get(
      `${config.CORE.HOST}/projects/${_projectId}/tasklists`,
      user.token
    )

    ctx.body = tasklists.data
  }

  //  获取任务分组下的任务列表
  async getStagesByTasklistsIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _tasklistsId } = ctx.state.params

    const stages = await axios.axios_get(
      `${config.CORE.HOST}/tasklists/${_tasklistsId}/stages`,
      user.token
    )

    for (let stage of stages.data) {
      const notDoneTasks = await axios.axios_get(
        `${config.CORE.HOST}/stages/${stage._id}/tasks`,
        user.token
      )
      const isDoneTasks = await axios.axios_get(
        `${config.CORE.HOST}/stages/${stage._id}/tasks?isDone=true`,
        user.token
      )
      stage.tasks = notDoneTasks.data.concat(isDoneTasks.data)
    }

    ctx.body = stages.data
  }

  //  获取企业星标项目
  async getStartByOrganizationIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    // await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)
    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const projects = await axios.axios_get(
      `${config.CORE.HOST}/organizations/${_organizationId}/projects/starred`,
      user.token
    )

    ctx.body = projects.data
  }

  //  获取个人所有项目
  async getProjectsAPI (ctx, next) {
    const { user } = ctx.state

    const projects = await axios.axios_get(
      `${config.CORE.HOST}/projects/personal`,
      user.token
    )

    ctx.body = projects.data
  }

  //  获取个人所有企业
  async getOrganizationsAPI (ctx, next) {
    const { user } = ctx.state

    let organizations = await axios.axios_get(
      `${config.CORE.HOST}/organizations`,
      user.token
    )

    for (let organization of organizations.data) {
      const _organizationId = organization._id
      let projects = await axios.axios_get(
        `${config.CORE.HOST}/organizations/${_organizationId}/projects/joined`,
        user.token
      )
      organization.projects = projects.data
    }

    ctx.body = organizations.data
  }

  //  任务搜索
  async getKeyresultBySearchAPI (ctx, next) {
    const { user } = ctx.state
    const {
      q,
      _organizationId,
      projectId,
      executorId,
      pageSize = 20
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let tql = `text ~ ${q}`

    if (projectId) {
      tql += ` AND projectId = ${projectId} `
    }

    if (executorId) {
      tql += `AND executorId = ${executorId}`
    }

    let query = `spaceType=organization&type=task&_organizationId=${_organizationId}&pageSize=${pageSize}&tql=${tql}`

    const tasks = await axios.axios_get(
      encodeURI(`${config.CORE.HOST}/v3/search?${query}`),
      user.token
    )
    ctx.body = tasks.data.result
  }

  //  目标搜索
  async getObjectiveBySearchAPI (ctx, next) {
    const { user } = ctx.state
    const {
      q,
      _organizationId,
      _okrPeriodId,
      boundToObjectType,
      _boundToObjectId,
      count = 20,
      page = 1
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const conds = {
      title: new RegExp(q),
      isDeleted: false,
      _organizationId: _organizationId
    }
    if (_okrPeriodId) {
      conds._okrPeriodId = _okrPeriodId
    }
    if (boundToObjectType) {
      conds.boundToObjectType = boundToObjectType
    }
    if (_boundToObjectId) {
      conds._boundToObjectId = _boundToObjectId
    }

    const objectives = await db.okrobjective
      .find(conds)
      .skip((page - 1) * count)
      .limit(count)
      .sort({ created: -1 })
    ctx.body = objectives

    await jsonify(ctx)
    await okrobjectiveCtrl.setMeanProgress(ctx)
  }

  async getIntellTasksAPI (ctx, next) {
    const { user } = ctx.state
    const { _id, type } = ctx.state.params
    let url = `${
      config.CORE.HOST
    }/projects/${_id}/tasks?_projectId=${_id}&withTasklist=true&withInvolves=true&withTags=true`
    switch (type) {
      case 'hasDone': {
        url = `${url}&isDone=true`
        break
      }
      case 'notDone': {
        url = `${url}&isDone=false`
        break
      }
      case 'today': {
        const endTime = `${new Date().toLocaleDateString()} 23:59:59.999`
        url = `${url}&isDone=false&dueDate__lt=${new Date(
          endTime
        ).toISOString()}`
      }
    }

    const tasks = await axios.axios_get(url, user.token)

    ctx.body = tasks.data
  }

  async checkLinkAPI (ctx, next) {
    const { user } = ctx.state
    let { link, _okrObjectiveId, _parentId, _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const regExp = new RegExp(`^((https|http)?:\/\/)(${config.LINK})`)
    const regResult = regExp.test(link)
    let response = false
    let association = {}
    if (!regResult) {
      return (ctx.body = { result: response })
    }

    const linkArr = link.split('/')
    const associationId = linkArr[linkArr.length - 1]
    let mode = linkArr[linkArr.length - 2]

    if (mode === 'objective') {
      if (_okrObjectiveId) {
        _parentId = _okrObjectiveId
      }

      if (_parentId) {
        const objective = await db.okrobjective.findOne({ _id: _parentId })
        let parents = objective.ancestorIds
        parents.push(_okrObjectiveId)
        parents = parents.map(val => {
          return _.toString(val)
        })
        if (!parents.includes(associationId)) {
          response = true
        }
      }

      association = await db.okrobjective.findOne({
        _id: ObjectId(associationId),
        _organizationId: _organizationId
      })

      if (!association) {
        response = false
      }
    } else {
      try {
        let task = await axios.axios_get(
          `${config.CORE.HOST}/tasks/${associationId}`,
          user.token
        )
        if (task.status === 200 && task.data) {
          response = true
          association = task.data
        }
      } catch (error) {
        
      }
    }

    if (!response) {
      ctx.body = { result: response }
    } else {
      ctx.body = { result: response, msg: association }
    }
  }

  //  创建更新关联信息权重动态
  async UpdateOkrAssociationActivity (user, okrassociation, okrobjective, type) {
    let action = 'update.association.dataweight'
    let associationType, associationTitle, resultMsg, dataWeight

    if(type === 'children') {
      associationTitle = okrassociation.title
      associationType = '子目标'
      dataWeight = okrassociation.weight
    } else {
      switch (okrassociation.type) {
        case 'task':
          associationType = '关联任务'
          resultMsg = await axios.axios_get(
            config.CORE.HOST + '/tasks/' + okrassociation._associationId,
            user.token
          )
          associationTitle = resultMsg.data.content
          break
  
        case 'objective':
          associationType = '关联目标'
          resultMsg = await db.okrobjective.findOne({
            _id: okrassociation._associationId
          })
          associationTitle = resultMsg.title
          break
      }
      dataWeight = okrassociation.dataWeight
    }
    
    let content = {
      objectiveTitle: okrobjective.title,
      dataWeight: dataWeight,
      associationType: associationType,
      associationTitle: associationTitle
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

module.exports = new OkrassociationCtrl()
