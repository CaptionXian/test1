const okrobjectiveCtrl = require('../controllers/okrobjective')
const ajvValidator = require('../middlewares/ajv')
const objectFind = require('../middlewares/object-find')

const Router = require('koa-router')

const router = new Router()
  .post(
    '/organizations/:_organizationId/okrobjectives',
    ajvValidator({
      type: 'object',
      properties: {
        _boundToObjectId: { type: 'string', format: 'objectid' },
        _executorId: { type: 'string', format: 'objectid' },
        _okrPeriodId: { type: 'string', format: 'objectid' },
        _organizationId: { type: 'string', format: 'objectid' },
        _parentId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        boundToObjectType: { type: 'string' },
        objectiveLabel: { type: 'string' },
        progress: { type: 'number', minimum: 0, maximum: 100 },
        title: { type: 'string', maxLength: 500 },
        weight: { type: 'number', minimum: 1, maximum: 10 },
        measure: { type: 'object' },
        objectives: {
          type: 'array',
          items: {
            type: 'string',
            format: 'objectid'
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'string',
            format: 'objectid'
          }
        },
        children: { 
          type: 'array',
          items: {
            type: 'object'
          }
        }
      },
      required: [
        'title',
        '_executorId',
        'boundToObjectType',
        '_boundToObjectId',
        '_organizationId',
        'objectiveLabel',
        '_okrPeriodId'
      ]
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.createOkrobjectiveAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives',
    ajvValidator({
      type: 'object',
      properties: {
        _boundToObjectId: { type: 'string', format: 'objectid' },
        _executorId: { type: 'string', format: 'objectid' },
        _okrPeriodId: { type: 'string', format: 'objectid' },
        _parentId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        boundToObjectType: { type: 'string' }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectiveAPI(ctx, next)
    }
  )
  //  获取简洁的目标（不带卷积计算和项目负责人等）
  .get(
    '/organizations/:_organizationId/simpleOkrobjectives',
    ajvValidator({
      type: 'object',
      properties: {
        _boundToObjectId: { type: 'string', format: 'objectid' },
        _executorId: { type: 'string', format: 'objectid' },
        _okrPeriodId: { type: 'string', format: 'objectid' },
        _parentId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        _okrObjectiveId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        boundToObjectType: { type: 'string' }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.getSimpleOkrobjectiveAPI(ctx, next)
    }
  )
  .put(
    '/okrobjectives/:_okrObjectiveId',
    ajvValidator({
      type: 'object',
      properties: {
        _boundToObjectId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        _executorId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        _okrPeriodId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        _parentId: {
          anyOf: [{ type: 'null' }, { type: 'string', format: 'objectid' }]
        },
        boundToObjectType: { anyOf: [{ type: 'null' }, { type: 'string' }] },
        progress: { type: 'number', minimum: 0, maximum: 100 },
        weight: { type: 'number', minimum: 1, maximum: 10 },
        title: { type: 'string', maxLength: 500 },
        objectiveLabel: { type: 'string' }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectiveAPI(ctx, next)
    }
  )
  .put(
    '/okrobjectives/:_okrObjectiveId/suspend',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        relatedUserIds: {
          type: 'array',
          items: { type: 'string', format: 'objectid' }
        },
        note: { type: 'string', maxLength: 500 }
      },
      required: ['note', 'relatedUserIds', '_okrObjectiveId'],
      ajvOptions: { coerceTypes: 'array' }
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectiveSuspendAPI(ctx, next)
    }
  )
  .put(
    '/okrobjectives/:_okrObjectiveId/resume',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectiveResumeAPI(ctx, next)
    }
  )
  .put(
    '/okrobjectives/:_okrObjectiveId/restart',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectiveRestartAPI(ctx, next)
    }
  )
  .delete(
    '/okrobjectives/:_okrObjectiveId',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.deleteOkrobjectiveAPI(ctx, next)
    }
  )
  .put(
    '/organizations/:_organizationId/okrProgressMode',
    ajvValidator({
      type: 'object',
      properties: {
        okrProgressMode: { type: 'string', enum: ['manual', 'okrkeyresult'] },
        _organizationId: { type: 'string', format: 'objectid' }
      },
      required: ['_organizationId', 'okrProgressMode']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateokrProgressModeAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives/permissions',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectivePermissionsAPI(ctx, next)
    }
  )
  .put(
    '/organizations/:_organizationId/okrobjectives/permissions/:boundToObjectType',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' },
        $add: { type: 'array', items: { type: 'string' } },
        $del: { type: 'array', items: { type: 'string' } },
        boundToObjectType: {
          type: 'string',
          enmu: ['organization', 'team', 'member', 'update', 'grade', 'restart']
        },
        action: {
          type: 'string',
          enum: ['get', 'create', 'update', 'grade', 'other']
        }
      },
      required: ['_organizationId', 'boundToObjectType', 'action'],
      oneOf: [
        {
          required: ['$add']
        },
        {
          required: ['$del']
        }
      ]
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectivePermissionsAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives/statistic',
    ajvValidator({
      type: 'object',
      properties: {
        _boundToObjectId: { type: 'string', format: 'objectid' },
        _executorId: { type: 'string', format: 'objectid' },
        _okrPeriodId: { type: 'string', format: 'objectid' },
        _organizationId: { type: 'string', format: 'objectid' },
        boundToObjectType: { type: 'string' },
        endDate: { type: 'string', format: 'date-time' },
        startDate: { type: 'string', format: 'date-time' }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectiveStatisticAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives/statistic-for-teams',
    ajvValidator({
      type: 'object',
      properties: {
        _okrPeriodId: { type: 'string', format: 'objectid' },
        _organizationId: { type: 'string', format: 'objectid' },
        endDate: { type: 'string', format: 'date-time' },
        joined: { type: 'boolean' },
        startDate: { type: 'string', format: 'date-time' }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectiveTeamStatisticAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives/statistic-for-team-members',
    ajvValidator({
      type: 'object',
      properties: {
        _okrPeriodId: { type: 'string', format: 'objectid' },
        _organizationId: { type: 'string', format: 'objectid' },
        _teamId: { type: 'string', format: 'objectid' },
        endDate: { type: 'string', format: 'date-time' },
        startDate: { type: 'string', format: 'date-time' }
      },
      required: ['_organizationId', '_teamId']
    }),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectiveTeamMembersStatisticAPI(ctx, next)
    }
  )
  .get(
    '/okrobjectives/:_okrObjectiveId/activities',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectivesActiviesAPI(ctx, next)
    }
  )
  //  目标评分
  .put(
    '/okrobjectives/:_okrObjectiveId/grade',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        score: { type: 'string', minimum: 0, maximum: 100 },
        resultSummary: { type: 'string', maxLength: 500 }
      },
      required: ['_okrObjectiveId', 'score']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrobjectiveGradeAPI(ctx, next)
    }
  )
  //  更改目标衡量方式
  .put(
    '/okrobjectives/:_okrObjectiveId/measure',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        mode: { type: 'string' },
        initial: { type: 'number' },
        target: { type: 'number' },
        current: { type: 'number' },
        unit: { type: 'string' }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrObjectiveMeasureAPI(ctx, next)
    }
  )
  //  新增关联
  .put(
    '/okrobjectives/:_okrObjectiveId/association',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        objectives: {
          type: 'array',
          items: {
            type: 'string',
            format: 'objectid'
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'string',
            format: 'objectid'
          }
        }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrObjectiveAssociationAPI(ctx, next)
    }
  )
  //  删除关联
  .delete(
    '/okrobjectives/:_okrObjectiveId/association',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        _associationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      required: ['_okrObjectiveId', '_associationId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.deleteOkrObjectiveAssociationAPI(ctx, next)
    }
  )
  //  更改目标评分标准
  .put(
    '/okrobjectives/:_okrObjectiveId/gradingStandard',
    ajvValidator({
      type: 'object',
      properties: {
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        gradingStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              describe: { type: 'string', maxLength: 500 },
              score: { type: 'number', minimum: 1, maximum: 100 },
              _id: { type: 'string', format: 'objectid' }
            }
          }
        }
      },
      required: ['_okrObjectiveId']
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectiveGradingStandardAPI(ctx, next)
    }
  )
  //  更改关联信息（关联的目标或任务，子目标）的权重
  .put(
    '/okrobjectives/:_okrObjectiveId/updateWeight',
    ajvValidator({
      type: 'object',
      properties: {
        _associationId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        type: { type: 'string', enum: ['children', 'association'] },
        dataWeight: { type: 'number', minimum: 1, maximum: 10 }
      },
      required: [
        '_associationId',
        'type',
        '_okrObjectiveId',
        'dataWeight'
      ]
    }),
    objectFind('okrobjective', '_okrObjectiveId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.updateOkrobjectiveWeightAPI(ctx, next)
    }
  )
module.exports = router
