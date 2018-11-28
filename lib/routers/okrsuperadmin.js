const Router = require('koa-router')
const ajvValidator = require('../middlewares/ajv')
const okrsuperadminCtrl = require('../controllers/okrsuperadmin')
const router = new Router()

  //   获取应用管理员
  .get(
    '/organization/:_organizationId/superAdmin',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrsuperadminCtrl.getSuperAdminAPI(ctx, next)
    }
  )

  //  创建应用管理员
  .post(
    '/organization/:_organizationId/superAdmin',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _userId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['_organizationId', '_userId']
    }),
    async (ctx, next) => {
      await okrsuperadminCtrl.createSuperAdminAPI(ctx, next)
    }
  )

  //  删除应用管理员
  .delete(
    '/organization/:_organizationId/superAdmin',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
            type: 'string',
            format: 'objectid'
          },
          _userId: {
            type: 'string',
            format: 'objectid'
          }
      },
      require: ['_organizationId', '_userId']
    }),
    async (ctx, next) => {
      await okrsuperadminCtrl.deleteSuperAdminAPI(ctx, next)
    }
  )

module.exports = router
