const _ = require('lodash')
const ilog = require('ilog')
const TWSOrganization = require('./tws-organization')

class TWSOrg {
  getBasicInfo (member, extraFields = []) {
    let user = {
      _id: member._userId,
      name:
        _.result(member, 'name') ||
        _.result(member, 'profile.name') ||
        _.result(member, 'userInfo.name') ||
        '',
      avatarUrl: member.avatarUrl || _.result(member, 'userInfo.avatarUrl')
    }

    if (!extraFields.length) {
      return user
    }

    for (let field of extraFields) {
      switch (field) {
        case 'email':
          user.email =
            _.result(member, 'profile.email') ||
            _.result(member, 'userInfo.email') ||
            ''
          break
        default:
          user[field] = _.result(member, field)
      }
    }

    return user
  }

  async getUserInOrg (_organizationId, _userId, extraFields) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let member

    try {
      member = await client
        .organizations(_organizationId)
        .members()
        .getByUser({ _userId: `${_userId}` })
    } catch (error) {
      ilog.error(error)
    }
    if (member) {
      return this.getBasicInfo(member, extraFields)
    }
  }

  async isTeamLeader (_organizationId, _userId, _teamId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let team = await client
      .organizations(_organizationId)
      .teams(_teamId)
      .info()
    return team && team._leaderId === _userId
  }

  async getTeamInOrg (_organizationId, _teamId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    return client
      .organizations(_organizationId)
      .teams(_teamId)
      .info()
  }

  async getDirectOrgMembersInTeam (_organizationId, _teamId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams(_teamId)
      .members()
      .list({ omitSubUnit: true })
    return ret.result
  }

  async getOrgSubteamsAPI (_organizationId, _teamId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams(_teamId)
      .subteams()
      .list({ onlyFirstLevel: true, omitSubUnit: true })
    return ret.result
  }

  async getTeamsByOrgAndUser (_organizationId, _userId) {
    let client = new TWSOrganization(_userId, 'user')
    let ret = await client
      .users(_userId)
      .teams()
      .list({ _organizationId })
    return ret.result
  }

  async getTeamsByOrganizationId (_organizationId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams()
      .list()
    return ret.result
  }

  async isTeamMember (_organizationId, _userId, _teamId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .teams(_teamId)
      .members()
      .batchGet({ _userIds: [`${_userId}`] })
    return _userId === _.result(ret, 'result[0]._userId')
  }

  async getTeamInOrgById (_organizationId, _teamId) {
    let client = new TWSOrganization(_organizationId, 'organization')
    return client
      .organizations(_organizationId)
      .teams(_teamId)
      .info()
  }

  async getMembersInOrg (_organizationId, _userIds) {
    let client = new TWSOrganization(_organizationId, 'organization')
    let ret = await client
      .organizations(_organizationId)
      .members()
      .batchGet({ _userIds })
    return ret.result
  }

  async userInfosComplement (ctx, _organizationId) {
    let result = ctx.body
    if (!Array.isArray(result)) {
      result = [ctx.body]
    }
    for (let item of result) {
      if (!item.isSuspended) {
        continue
      }

      let users = await this.getMembersInOrg(
        _organizationId,
        item.relatedUserIds
      )

      item.relatedUsers = users.map(user => {
        let userInfo = _.pick(user, ['_userId', 'name'])
        userInfo.avatarUrl = _.result(user, 'userInfo.avatarUrl')
        return userInfo
      })
    }
  }
}

module.exports = new TWSOrg()
