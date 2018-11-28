const Router = require('koa-router')
const ajvValidator = require('../middlewares/ajv')
const objectFind = require('../middlewares/object-find')
const okrassociationCtrl = require('../controllers/okrassociation')

const router = new Router()

  //  获取企业当前所有项目
  .get(
    '/organizations/:_organizationId/projects',
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
      await okrassociationCtrl.getProjectsByOrgIdAPI(ctx, next)
    }
  )
  //  获取项目下任务分组
  .get(
    '/projects/:_projectId/tasklists',
    ajvValidator({
      type: 'object',
      properties: {
        _projectId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['_projectId']
    }),
    async (ctx, next) => {
      await okrassociationCtrl.getTasklistsByProjectIdAPI(ctx, next)
    }
  )
  //  获取任务分组下的任务列表
  .get(
    '/tasklists/:_tasklistsId/stages',
    ajvValidator({
      type: 'object',
      properties: {
        _tasklistsId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['_tasklistsId']
    }),
    async (ctx, next) => {
      await okrassociationCtrl.getStagesByTasklistsIdAPI(ctx, next)
    }
  )
  //  获取企业星标项目
  .get(
    '/organizations/:_organizationId/projects/starred',
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
      await okrassociationCtrl.getStartByOrganizationIdAPI(ctx, next)
    }
  )
  //  获取个人所有项目
  .get('/user/projects', async (ctx, next) => {
    await okrassociationCtrl.getProjectsAPI(ctx, next)
  })
  //  获取个人所有企业
  .get('/user/organizations', async (ctx, next) => {
    await okrassociationCtrl.getOrganizationsAPI(ctx, next)
  })
  //  任务搜索
  .get(
    '/searchTask',
    ajvValidator({
      type: 'object',
      properties: {
        q: {
          type: 'string'
        },
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        projectId: {
          type: 'string',
          format: 'objectid'
        },
        executorId: {
          type: 'string',
          format: 'objectid'
        },
        pageSize: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        page: {
          type: 'number',
          minimum: 1
        }
      },
      require: ['q', '_organizationId']
    }),
    async (ctx, next) => {
      await okrassociationCtrl.getKeyresultBySearchAPI(ctx, next)
    }
  )
  //  目标搜索
  .get(
    '/searchObjective',
    ajvValidator({
      type: 'object',
      properties: {
        q: {
          type: 'string'
        },
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _okrPeriodId: {
          type: 'string',
          format: 'objectid'
        },
        boundToObjectType: {
          type: 'string'
        },
        _boundToObjectId: {
          type: 'string',
          format: 'objectid'
        },
        count: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        page: {
          type: 'number',
          minimum: 1
        }
      },
      require: ['q']
    }),
    async (ctx, next) => {
      await okrassociationCtrl.getObjectiveBySearchAPI(ctx, next)
    }
  )
  //  获取智能分组任务
  .get(
    '/projects/:_id/tasks',
    ajvValidator({
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          format: 'objectid'
        },
        type: {
          type: 'string'
        }
      },
      require: ['_id', 'type']
    }),
    async (ctx, next) => {
      await okrassociationCtrl.getIntellTasksAPI(ctx, next)
    }
  )
  //  校验链接
  .get(
    '/checkLink',
    ajvValidator({
      type: 'object',
      properties: {
        link: {
          type: 'string'
        },
        _organizationId: {
          type: 'string',
          format: 'objectid'
        },
        _okrObjectiveId: {
          type: 'string',
          format: 'objectid'
        },
        _parentId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['link']
    }),
    async (ctx, next) => {
      await okrassociationCtrl.checkLinkAPI(ctx, next)
    }
  )

module.exports = router
