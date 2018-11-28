const { Base } = require('./base')
const permission = require('../middlewares/permission')
const db = require('../services/mongo')
const axios = require('../utils/axios')
const config = require('config')
const _ = require('lodash')
const jsonify = require('../utils/jsonify')

class OkrsuperadminCtrl extends Base {
  //  获取应用管理员
  async getSuperAdminAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const conds = { _organizationId, isDeleted: false }
    ctx.body = await db.okrsuperadmin.find(conds)

    await jsonify(ctx)
    await this.setWithUserMsg(ctx)
  }

  // 新建应用管理员
  async createSuperAdminAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId, _userId } = ctx.state.params

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    let data = {
      _organizationId,
      _userId,
      _creatorId: user._id
    }

    const okrsuperadmin = await db.okrsuperadmin.create(data)
    ctx.body = okrsuperadmin

    await jsonify(ctx)
    await this.setWithUserMsg(ctx)
  }

  //  删除应用管理员
  async deleteSuperAdminAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId, _userId } = ctx.state.params

    await permission.isOrganizationAdminOrOwner(ctx, _organizationId, user._id)

    const conds = { _organizationId, _userId, isDeleted: false }
    const update = {
        isDeleted: true,
        updated: new Date()
    }

    ctx.body = await db.okrsuperadmin.update(conds, { $set: update })

  }

  //  附带用户信息
  async setWithUserMsg (ctx) {
    const { user } = ctx.state
    let result = ctx.body
    if (!Array.isArray(result)) {
      result = [ctx.body]
    }

    for (let okrsuperadmin of result) {
      const { _organizationId, _userId } = okrsuperadmin
      let userMsg = await axios.axios_get(
        `${config.CORE.HOST}/organizations/${_organizationId}/members/detail?_userId=${_userId}`,
        user.token
      )
      okrsuperadmin.userMsg = userMsg.data
    }
  }
}

module.exports = new OkrsuperadminCtrl()
