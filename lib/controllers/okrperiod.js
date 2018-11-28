const _ = require('lodash')
const db = require('../services/mongo')
const ObjectId = require('mongoose').Types.ObjectId
const { Base } = require('./base')
const permission = require('../middlewares/permission')

class OkrperiodCtrl extends Base {
  async findByConds (conds) {
    return db.okrperiod.find(conds).sort({ "startDate": -1 })
  }

  async createOkrperiod (data) {
    const okrperiod = await db.okrperiod.create(data)
    return okrperiod
  }

  async findPeriodIds (_organizationId, startDate, endDate) {
    startDate = new Date(startDate)
    endDate = new Date(endDate)

    let conds = {
      _organizationId,
      isDeleted: false,
      $or: [
        // 结束日期在区间中
        {
          endDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // 开始日期在区间中
        {
          startDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // 开始结束时间包含区间
        {
          startDate: {
            $lt: startDate
          },
          endDate: {
            $gt: endDate
          }
        }
      ]
    }

    return db.okrperiod.distinct('_id', conds)
  }

  async createOkrperiodAPI (ctx, next) {
    const { user } = ctx.state
    const {
      name,
      startDate,
      endDate,
      _organizationId,
      dateType
    } = ctx.state.params

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    ctx.body = await this.createOkrperiod({
      name,
      startDate,
      endDate,
      _organizationId,
      _creatorId: user._id,
      dateType
    })
  }

  async getOkrperiodAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const conds = {
      _organizationId,
      isDeleted: false
    }
    
    ctx.body = await this.findByConds(conds)
  }

  async updateOkrperiodAPI (ctx, next) {
    const { user, okrperiod } = ctx.state
    const { name, startDate, endDate, isEnd, dateType } = ctx.state.params

    await permission.isOrganizationAdminOrOwner(
      ctx,
      okrperiod._organizationId,
      user._id
    )

    const changes = _.omitBy(
      {
        name,
        startDate,
        endDate,
        updated: new Date(),
        isEnd,
        dateType
      },
      _.isUndefined
    )

    _.assign(okrperiod, changes)
    await okrperiod.save()

    ctx.body = okrperiod
  }

  async deleteOkrperiodAPI (ctx, next) {
    const { user, okrperiod } = ctx.state

    await permission.isOrganizationAdminOrOwner(
      ctx,
      okrperiod._organizationId,
      user._id
    )

    okrperiod.isDeleted = true
    okrperiod.updated = new Date()
    await okrperiod.save()

    ctx.body = {}

    this.emit('inhouse.okrperiod.remove', ctx)
  }

  async findNamesByPeriodIds (_periodIds) {
    let names = []
    for (let _periodId of _periodIds) {
      let period = await db.okrperiod.findOne({ _id: _periodId }, { name: 1 })
      names.push(period.name)
    }
    return names
  }
  
  async findAll() {
    const conds = { isDeleted: false }
    let okrperiods = await db.okrperiod.find(conds, { _id: 1 })
    okrperiods.map( val => {
      return val = val._id
    })
    return okrperiods
  }

}

module.exports = new OkrperiodCtrl()
