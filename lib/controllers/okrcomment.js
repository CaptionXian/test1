const db = require('../services/mongo')
const config = require('config')

const { Base } = require('./base')
const twsOrg = require('../services/tws-org')
const { jsonify } = require('../utils')

class Okrcomment extends Base {

  async getAllOkrComment(_okrObjectiveId) {
    return await db.okrcomment
      .find({ _okrObjectiveId })
      .sort({ created: -1 })
      .lean()
      .exec()
  }

  async getUserInfo(ctx, _organizationId) {
    const okrcomments = ctx.body

    await Promise.all(okrcomments.map( async (v) => {
      const _creatorId = await twsOrg.getUserInOrg(
        _organizationId,
        v._creatorId,
      )
      return Object.assign(v, { _creatorId })
    }))
  }

  async creatOkrComment(ctx, next) {
    const { user } = ctx.state
    const {
      content,
      _okrObjectiveId,
      _organizationId,
    } = ctx.state.params

    await db.okrcomment.create({
      content,
      _okrObjectiveId,
      _creatorId: user._id,
    })

    ctx.body = await this.getAllOkrComment(_okrObjectiveId)

    await this.getUserInfo(ctx, _organizationId)
  }

  async updateOkrComment(ctx, next) {
    const { user } = ctx.state
    const {
      content,
      _okrCommentId,
      _okrObjectiveId,
      _organizationId,
    } = ctx.state.params

    const okrcomment = await db.okrcomment.findByIdAndUpdate(_okrCommentId, {
      content,
    }, {
      new: true
    }).lean().exec()

    ctx.body = await this.getAllOkrComment(_okrObjectiveId)

    await this.getUserInfo(ctx, _organizationId)
  }

  async getOkrComment(ctx, next) {
    const {
      _okrObjectiveId,
      _organizationId,
    } = ctx.state.params

    ctx.body = await this.getAllOkrComment(_okrObjectiveId)
    
    await this.getUserInfo(ctx, _organizationId)
  }

  async getOkrCommentById(ctx, next) {
    const { okrcomment } = ctx.state
    const {
      _organizationId
    } = ctx.state.params

    ctx.body = okrcomment
    
    await this.getUserInfo(ctx, _organizationId)
  }

  async deleteOkrComment(ctx, next) {
    const { okrcomment } = ctx.state
    const {
      _okrCommentId,
    } = ctx.state.params
    
    await db.okrcomment.findByIdAndRemove(_okrCommentId)

    ctx.body = okrcomment
  }
}

module.exports = new Okrcomment()