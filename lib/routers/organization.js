const Router = require('koa-router')

const ajvValidator = require('../middlewares/ajv')
const organizationCtrl = require('../controllers/organization')

const router = new Router()
  .get(
    '/organizations/:_organizationId',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgByIdAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/members/me',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgMeAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/members',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgMembersAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/teams',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgTeamsAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/teams/:_teamId/subTeams',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _teamId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId', '_teamId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgSubteamsAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/teams/:_teamId/members',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _teamId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId', '_teamId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getTeamMembersAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/teams/me',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgMyTeamsAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/firstTeams',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await organizationCtrl.getOrgFirstTeamsAPI(ctx, next)
    }
  )

module.exports = router
