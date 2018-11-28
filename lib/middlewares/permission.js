const twsOrg = require('../services/tws-org')

const ROLE = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2
}

const Permssion = {}

Permssion.isOrganizationMember = async (ctx, _organizationId, _userId) => {
  if (!_organizationId) {
    ctx.throw(401)
  }

  let member = await twsOrg.getUserInOrg(_organizationId, _userId, ['role'])
  if (member && member.role >= ROLE.MEMBER) {
    return true
  }

  ctx.throw(401)
}

Permssion.isOrganizationAdminOrOwner = async (
  ctx,
  _organizationId,
  _userId
) => {
  if (!_organizationId) {
    ctx.throw(401)
  }
  let member = await twsOrg.getUserInOrg(_organizationId, _userId, ['role'])
  if (member && member.role >= ROLE.ADMIN) {
    return true
  }
  ctx.throw(401)
}

module.exports = Permssion
