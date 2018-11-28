const _ = require('lodash')
const db = require('../services/mongo')
const config = require('config')

const { Base } = require('./base')
const permission = require('../middlewares/permission')

class OkrgradingstandardCtrl extends Base {
  findByConds(conds) {
    return db.okrgradingstandard.find(conds)
  }

  findById(id) {
    return db.okrgradingstandard.findById(id)
  }

  async createOkrgradingStandard(data) {
    const okrgradingstandard = await db.okrgradingstandard.create(data)
    return okrgradingstandard
  }

  async deleteOkrgradingStandard(id) {
    return await db.okrgradingstandard.findByIdAndDelete(id)
  }

  async createOkrgradingStandardAPI(ctx, next) {
    const { user } = ctx.state
    const {
      gradingStandards,
      standardType,
      _okrLinkId,
      _organizationId,
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const okrgradingstandard = await this.createOkrgradingStandard({
      gradingStandards,
      standardType,
      _okrLinkId,
      _organizationId,
    })

    switch (Number(standardType)) {
      case 0:
        ctx.body = okrgradingstandard
        break;
      case 1:
        ctx.body = await this
          .findById(okrgradingstandard._id)
          .populate({ path: '_okrLinkId', model: 'okrperiod' })
        break;
      case 2: {
        ctx.body = await this
          .findById(okrgradingstandard._id)
          .populate({ path: '_okrLinkId', model: 'okrobjective' })
          .populate({
            path: '_okrLinkId',
            model: 'okrobjective',
            populate: { path: '_okrPeriodId', model: 'okrperiod' }
          })
        const okrobjective = await db.okrobjective.findById(_okrLinkId)
        ctx.state.okrobjective = okrobjective
        this.emit('inhouse.okrgradingstandard.update', ctx)
      }
        break;
      default:
        break;
    }
  }

  async updateOkrgradingStandardAPI(ctx, next) {
    const { user, okrgradingstandard } = ctx.state
    const {
      gradingStandards,
      standardType,
      _okrLinkId,
      _organizationId,
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const changes = _.omitBy(
      {
        gradingStandards,
        standardType,
        _okrLinkId,
        _organizationId,
      },
      _.isUndefined
    )

    _.assign(okrgradingstandard, changes)
    await okrgradingstandard.save()


    switch (Number(standardType)) {
      case 0:
        ctx.body = okrgradingstandard
        break;
      case 1:
        ctx.body = await this
          .findById(okrgradingstandard._id)
          .populate({ path: '_okrLinkId', model: 'okrperiod' })
        break;
      case 2: {
        ctx.body = await this
          .findById(okrgradingstandard._id)
          .populate({
            path: '_okrLinkId',
            model: 'okrobjective',
            populate: { path: '_okrPeriodId', model: 'okrperiod' }
          })
        const okrobjective = await db.okrobjective.findById(_okrLinkId)
        ctx.state.okrobjective = okrobjective
        this.emit('inhouse.okrgradingstandard.update', ctx)
      }
        break;
      default:
        break;
    }
  }

  async getOkrgradingStandardAPI(ctx, next) {
    const { user } = ctx.state
    const {
      _organizationId,
    } = ctx.state.params

    // await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)
    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let systemStandards = await this
      .findByConds({ standardType: 0, _organizationId })

    const periodStandards = await this
      .findByConds({ standardType: 1, _organizationId })
      .populate({ path: '_okrLinkId', model: 'okrperiod' })

    const objectiveStandards = await this
      .findByConds({ standardType: 2, _organizationId })
      .populate({
        path: '_okrLinkId',
        model: 'okrobjective',
        populate: { path: '_okrPeriodId', model: 'okrperiod' }
      })


    if (!systemStandards.length) {
      //没有系统评分标准，采用配置中的默认值
      systemStandards = [{
        gradingStandards: config.GRADINGSTANDARD,
        standardType: 0,
        _organizationId,
      }]
    }
    ctx.body = { systemStandards, periodStandards, objectiveStandards }
  }

  async deleteOkrgradingStandardAPI(ctx, next) {
    const { user } = ctx.state
    const {
      _okrGradingStandardId,
      _organizationId,
    } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let okrgradingstandard = await this.findById(_okrGradingStandardId)
    if (okrgradingstandard.standardType === 0) {
      okrgradingstandard = {
        gradingStandards: config.GRADINGSTANDARD,
        standardType: 0,
        _organizationId,
      }
    }

    await this.deleteOkrgradingStandard(_okrGradingStandardId)

    const okrobjective = await db.okrobjective.findById(okrgradingstandard._okrLinkId)
    ctx.state.okrobjective = okrobjective
    this.emit('inhouse.okrgradingstandard.delete', ctx)

    ctx.body = okrgradingstandard
  }
}

module.exports = new OkrgradingstandardCtrl()