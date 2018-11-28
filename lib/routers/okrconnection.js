const Router = require('koa-router')

const ajvValidator = require('../middlewares/ajv')
const objectFind = require('../middlewares/object-find')
const okrconnectionCtrl = require('../controllers/okrconnection')

const router = new Router()
  .get(
    '/organizations/:_organizationId/okrconnections',
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
      await okrconnectionCtrl.getByOrgIdAPI(ctx, next)
    }
  )
  .post(
    '/organizations/:_organizationId/okrconnections',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _fromId: {
          type: 'string',
          format: 'objectid'
        },
        _toId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId', '_fromId', '_toId']
    }),
    objectFind('okrobjective', '_fromId', true, 'fromObjective'),
    objectFind('okrobjective', '_toId', true, 'toObjective'),
    async (ctx, next) => {
      await okrconnectionCtrl.createAPI(ctx, next)
    }
  )
  .delete(
    '/organizations/:_organizationId/okrconnections/:_connectionId',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _connectionId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_organizationId', '_connectionId']
    }),
    objectFind('okrconnection', '_connectionId'),
    async (ctx, next) => {
      await okrconnectionCtrl.deleteAPI(ctx, next)
    }
  )
  .put(
    '/organizations/:_organizationId/okrconnections/:_connectionId/note',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _connectionId: {
          type: 'string',
          format: 'objectid'
        },
        note: {
          type: 'string'
        }
      },
      required: ['_organizationId', '_connectionId', 'note']
    }),
    objectFind('okrconnection', '_connectionId'),
    async (ctx, next) => {
      await okrconnectionCtrl.updateNoteAPI(ctx, next)
    }
  )

module.exports = router
