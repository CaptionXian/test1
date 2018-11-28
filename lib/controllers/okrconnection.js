const db = require('../services/mongo')
const { Base } = require('./base')
const permission = require('../middlewares/permission')

class OkrconnectionCtrl extends Base {
  async create (data) {
    return db.okrconnection.create(data)
  }

  async createAPI (ctx, next) {
    const { user, fromObjective } = ctx.state
    const { _fromId, _toId, note, _organizationId } = ctx.state.params

    if (fromObjective._organizationId.toString() !== _organizationId) {
      ctx.throw(400, '_organizationId error')
    }

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    ctx.body = await this.create({
      _creatorId: user._id,
      _fromId,
      _toId,
      note,
      _organizationId
    })
  }

  async getByOrgIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    ctx.body = await db.okrconnection.find({ _organizationId })
  }

  async deleteAPI (ctx, next) {
    const { user, okrconnection } = ctx.state
    const { _organizationId } = ctx.state.params

    if (okrconnection._organizationId.toString() !== _organizationId) {
      ctx.throw(400, '_organizationId error')
    }

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    await okrconnection.remove()

    ctx.body = {}
  }

  async updateNoteAPI (ctx, next) {
    const { user, okrconnection } = ctx.state
    const { _organizationId, note } = ctx.state.params

    if (okrconnection._organizationId.toString() !== _organizationId) {
      ctx.throw(400, '_organizationId error')
    }

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    okrconnection.note = note
    okrconnection.updated = new Date()
    await okrconnection.save()

    ctx.body = okrconnection
  }
}

module.exports = new OkrconnectionCtrl()
