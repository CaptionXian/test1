const permission = require('../middlewares/permission')
const TWSOrganization = require('../services/tws-organization')
const twsOrg = require('../services/tws-org')

const { Base } = require('./base')

class OrganizationCtrl extends Base {
  async getOrgByIdAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client.organizations(_organizationId).info()

    delete ret.organization
    ctx.body = ret
  }

  async getOrgMeAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .members()
      .getByUser({ _userId: user._id })

    ctx.body = ret
  }

  async getOrgMembersAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .members()
      .list({
        pageSize: 2000
      })

    ctx.body = ret
  }

  async getOrgTeamsAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams()
      .list()

    ctx.body = ret
  }

  async getOrgMyTeamsAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(user._id, 'user')
    let ret = await client
      .users(user._id)
      .teams()
      .list({ _organizationId })

    ctx.body = ret
  }

  async getTeamMembersAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId, _teamId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams(_teamId)
      .members()
      .list({
        pageSize: 2000
      })

    ctx.body = ret.result
  }

  //  获取顶级部门
  async getOrgFirstTeamsAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams()
      .list({
        onlyFirstLevel: true,
        omitSubUnit: true,
        withMemberCount: true
      })

    ctx.body = ret
  }

  //  获取子部门
  async getOrgSubteamsAPI (ctx, next) {
    const { user } = ctx.state
    const { _organizationId, _teamId } = ctx.state.params

    await permission.isOrganizationMember(ctx, _organizationId, user._id)

    const ret = await twsOrg.getOrgSubteamsAPI(_organizationId, _teamId)
    ctx.body = ret
  }
}

module.exports = new OrganizationCtrl()
