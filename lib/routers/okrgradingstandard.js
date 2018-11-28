const Router = require('koa-router')

const ajvValidator = require('../middlewares/ajv')
const objectFind = require('../middlewares/object-find')
const okrgradingstandardCtrl = require('../controllers/okrgradingstandard')

const router = new Router()
  .post(
    '/organizations/:_organizationId/okrgradingstandards',
    ajvValidator({
      type: 'object',
      properties: {
        gradingStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              describe: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 101 },
            }
          }
        },
        standardType: { type: 'number', enum: [0, 1, 2] },
        _okrLinkId: { type: 'string', format: 'objectid' },
        _organizationId: { type: 'string', format: 'objectid' },
      },
      required: ['gradingStandards', '_okrLinkId', 'standardType', '_organizationId']
    }),
    async (ctx, next) => {
      await okrgradingstandardCtrl.createOkrgradingStandardAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrgradingstandards',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' },
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrgradingstandardCtrl.getOkrgradingStandardAPI(ctx, next)
    }
  )
  .put(
    '/organizations/:_organizationId/okrgradingstandards/:_okrGradingStandardId',
    ajvValidator({
      type: 'object',
      properties: {
        gradingStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              describe: { type: 'string' },
              score: { type: 'number', minimum: 1, maximum: 100 },
            }
          }
        },
        standardType: { type: 'number', enum: [0, 1, 2] },
        _okrLinkId: { type: 'string', format: 'objectid' },
        _organizationId: { type: 'string', format: 'objectid' },
        _okrGradingStandardId: { type: 'string', format: 'objectid' },
      },
      required: ['_okrGradingStandardId']
    }),
  objectFind('okrgradingstandard', '_okrGradingStandardId'),
    async (ctx, next) => {
      await okrgradingstandardCtrl.updateOkrgradingStandardAPI(ctx, next)
    }
  )
  .delete(
    '/organizations/:_organizationId/okrgradingstandards/:_okrGradingStandardId',
    ajvValidator({
      type: 'object',
      properties: {
        _okrGradingStandardId: { type: 'string', format: 'objectid' },
      },
      required: ['_okrGradingStandardId']
    }),
    async (ctx, next) => {
      await okrgradingstandardCtrl.deleteOkrgradingStandardAPI(ctx, next)
    }
  )

module.exports = router
