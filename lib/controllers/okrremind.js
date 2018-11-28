const { Base } = require('./base')
const permission = require('../middlewares/permission')
const db = require('../services/mongo')
const twsOrg = require('../services/tws-org')
const createErr = require('http-errors')
const validator = require('validator')
const _ = require('lodash')
const jsonify = require('../utils/jsonify')
const okrperiodCtrl = require('./okrperiod')
const okrobjectiveCtrl = require('./okrobjective')
const schedule = require('node-schedule')

class OkrremindCtrl extends Base {
  // 校验参数
  async validateParams (ctx) {
    const { model, type, repeat, dates, time, _periods } = ctx.state.params

    if (!['progress', 'grade'].includes(model)) {
      throw createErr('ParamsErr', 'model')
    }

    if (
      model === 'progress' &&
      !['organization', 'team', 'member'].includes(type)
    ) {
      throw createErr('ParamsErr', 'type')
    }

    if (dates.length < 1) {
      throw createErr('ParamsErr', 'dates')
    }

    if (time < 0 || time > 23) {
      throw createErr('ParamsErr', 'time')
    }

    if (!_periods || _periods.length < 1) {
      throw createErr('ParamsErr', '_periods')
    }

    if(_periods[0] !== 'all'){
      _periods.map(val => {
        if (!validator.isMongoId(val)) throw createErr('ParamsErr', '_periods')
      })
    }
  }

  //  获取企业提醒配置
  async getRemindByOrgIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    // await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)
    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const conds = { _organizationId, isDeleted: false }
    ctx.body = await db.okrremind.find(conds)

    await jsonify(ctx)
    await this.setWithPeriodMsg(ctx, next)
  }

  // 新建企业提醒配置
  async createOkrremindAPI (ctx, next) {
    await this.validateParams(ctx)
    const { user } = ctx.state
    const {
      _organizationId,
      model,
      type,
      repeat,
      dates,
      time,
      _periods
    } = ctx.state.params

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    let data = {
      _organizationId,
      model,
      type,
      repeat,
      dates,
      time,
      _creatorId: user._id,
      _periods
    }
    if (model === 'grade') {
      data = _.omit(data, ['type', 'repeat'])
    }
    if(_periods[0] === 'all') {
      data._periods = await okrperiodCtrl.findAll()
    }
    const okrremind = await db.okrremind.create(data)
    ctx.body = okrremind

    await jsonify(ctx)
    await this.setWithPeriodMsg(ctx, next)
  }

  //  编辑提醒配置
  async updateOkrremindAPI (ctx, next) {
    await this.validateParams(ctx)
    const { user, okrremind } = ctx.state
    const { model, type, repeat, dates, time, _periods } = ctx.state.params
    const { _organizationId } = okrremind

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    let changes = _.omitBy(
      {
        _organizationId,
        model,
        type,
        repeat,
        dates,
        time,
        _creatorId: user._id,
        _periods,
        updated: new Date()
      },
      _.isUndefined
    )
    if (model === 'grade') {
      changes = _.omit(changes, ['type', 'repeat'])
    }
    if(_periods[0] === 'all') {
      changes._periods = await okrperiodCtrl.findAll()
    }

    _.assign(okrremind, changes)

    ctx.body = await okrremind.save()

    await jsonify(ctx)
    await this.setWithPeriodMsg(ctx, next)
  }

  //  删除周期配置
  async deleteOkrremindAPI (ctx, next) {
    const { user, okrremind } = ctx.state
    const { _organizationId } = okrremind

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    _.assign(okrremind, { isDeleted: true })

    ctx.body = await okrremind.save()

    await jsonify(ctx)
    await this.setWithPeriodMsg(ctx, next)
  }

  //  附带周期信息
  async setWithPeriodMsg (ctx) {
    let result = ctx.body
    if (!Array.isArray(result)) {
      result = [ctx.body]
    }

    for (let remind of result) {
      if(remind._periods[0] === 'all'){
        //  返回所有周期的信息
        remind.periodNames = await okrperiodCtrl.findAllNames()
      }else{
        remind.periodNames = await okrperiodCtrl.findNamesByPeriodIds(
          remind._periods
        )
      }
    }
  }

  //  定时任务
  scheduleCronstyle () {
    schedule.scheduleJob('*/5 * * * * *', async function () {
      const date = new Date().getDate()
      const day = new Date().getDay()
      const hours = new Date().getHours()

      const reminds = await db.okrremind
        .find({ time: hours, isDeleted: false })
        .lean()
      let periods = []
      for (let remind of reminds) {
        if (remind.model === 'progress') {
          switch (remind.repeat) {
            case 0:
              await okrobjectiveCtrl.remindExector(
                remind._periods,
                remind.type,
                'objective'
              )
              break
            case 1:
              if (remind.dates.includes(day)) {
                await okrobjectiveCtrl.remindExector(
                  remind._periods,
                  remind.type,
                  'objective'
                )
              }
              break
            case 2:
              if (remind.dates.includes(date)) {
                await okrobjectiveCtrl.remindExector(
                  remind._periods,
                  remind.type,
                  'objective'
                )
              }
              break
          }
        } else {
          //  评分提醒
        }
      }
    })
  }
}

module.exports = new OkrremindCtrl()
