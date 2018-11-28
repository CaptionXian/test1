const sinon = require('sinon')
require('../../lib/services/mongo')
const db = require('../services/mongo')
const request = require('supertest')(global.server)
const ObjectId = require('mongoose').Types.ObjectId
const { mocker } = require('../tools/index')
const twsOrg = require('../../lib/services/tws-org')
const okrobjectiveCtrl = require('../../lib/controllers/okrobjective')

describe('okrobjectiveCtrl setExecutor', () => {
  let _organizationId, _userId, okrobjective

  beforeEach(async () => {
    _userId = ObjectId()
    _organizationId = ObjectId()

    // create okrobjective
    okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId,
        _executorId: _userId,
        boundToObjectType: 'member',
        _boundToObjectId: _userId
      })
    )
  })

  it('should have property executor', async () => {
    let stub = sinon.stub(twsOrg, 'getUserInOrg').callsFake(() => {
      return {
        _id: `${_userId}`,
        name: 'some name',
        avatarUrl: 'some avatarUrl'
      }
    })
    let ctx = {
      body: [okrobjective]
    }

    await okrobjectiveCtrl.setExecutor(ctx, _organizationId)
    ctx.body.forEach(doc => {
      expect(okrobjective).toHaveProperty('executor')
      expect(okrobjective.executor).toHaveProperty('_id')
      expect(okrobjective.executor).toHaveProperty('name')
      expect(okrobjective.executor).toHaveProperty('avatarUrl')
      expect(okrobjective.executor).toHaveProperty('status')
      expect(`${okrobjective.executor._id}`).toBe(`${_userId}`)
      expect(okrobjective.executor.status).toBe('in')
    })

    stub.restore()
  })

  it('status should be disabled', async () => {
    let stub = sinon.stub(twsOrg, 'getUserInOrg').callsFake(() => {
      return {
        _id: `${_userId}`,
        isDisabled: true,
        name: 'some name',
        avatarUrl: 'some avatarUrl'
      }
    })

    let ctx = {
      body: [okrobjective]
    }

    await okrobjectiveCtrl.setExecutor(ctx, _organizationId)
    ctx.body.forEach(okrobjective => {
      expect(okrobjective.executor.status).toBe('disabled')
    })
    stub.restore()
  })

  it('status should be quited', async () => {
    let stub = sinon.stub(twsOrg, 'getUserInOrg').callsFake(() => {
      return null
    })

    let ctx = {
      body: [okrobjective]
    }
    await okrobjectiveCtrl.setExecutor(ctx, null)
    ctx.body.forEach(okrobjective => {
      expect(okrobjective.executor.status).toBe('quited')
    })
    stub.restore()
  })
})

describe('okrobjectiveCtrl setMeanProgress', function () {
  let _organizationId, _userId, okrobjective

  beforeEach(async () => {
    _userId = ObjectId()
    _organizationId = ObjectId()

    // create okrobjective
    okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId,
        _executorId: _userId,
        boundToObjectType: 'member',
        _boundToObjectId: _userId
      })
    )
  })

  it('should have property meanProgress, default 0', async () => {
    let ctx = {
      body: [okrobjective.toJSON()]
    }
    await okrobjectiveCtrl.setMeanProgress(ctx)
    ctx.body.forEach(okrobjective => {
      expect(okrobjective).toHaveProperty('meanProgress')
      expect(okrobjective.meanProgress).toBe(0)
    })
  })

  it('meanProgress should be mean of okrkeyresults progress', async () => {
    // 创建 目标下的 关键结果
    let okrkeyresults = [
      {
        title: 'keyresult1',
        _okrObjectiveId: okrobjective._id,
        measure: { initial: 0, target: 100, current: 40 },
        weight: 2
      },
      {
        title: 'keyresult2',
        _okrObjectiveId: okrobjective._id,
        measure: { initial: 0, target: 100, current: 60 },
        weight: 8
      }
    ]

    let user = mocker.user()
    // 创建 目标下的 关键结果, 涉及 progress 计算, 需要走 API
    await request
      .post(`/okrobjectives/${okrobjective._id}/okrkeyresults`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({ okrkeyresults })
      .expect(200)

    let ctx = {
      body: [okrobjective.toJSON()]
    }
    await okrobjectiveCtrl.setMeanProgress(ctx)
    ctx.body.forEach(doc => {
      expect(doc.meanProgress).toBe(56)
    })
  })
})

describe('validateBoundToObject', function () {
  let _organizationId, _userId, okrobjective

  beforeEach(async () => {
    _userId = ObjectId()
    _organizationId = ObjectId()

    // create okrobjective
    okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId,
        _executorId: _userId,
        boundToObjectType: 'member',
        _boundToObjectId: _userId
      })
    )
  })

  // 企业类型目标 _boundToObjectId 必须为 _organizationId
  it('type organization _boundToObjectId should equal _organizationId', async () => {
    let badObjectId = `${_userId}` // 无效的
    let ctx = {
      state: {
        params: {
          _organizationId: `${_organizationId}`,
          boundToObjectType: 'organization',
          _boundToObjectId: badObjectId,
          _executorId: `${_userId}`
        }
      }
    }
    await okrobjectiveCtrl.validateBoundToObject(ctx, null)
    expect(ctx.state.params._boundToObjectId).toBe(`${_organizationId}`)
  })

  // 企业类型目标 不能存在上级
  it('type organization _parentId should be empty', async () => {
    let badOrganizationId = `${_userId}` // 无效的企业id
    let ctx = {
      state: {
        params: {
          _organizationId: `${_organizationId}`,
          boundToObjectType: 'organization',
          _boundToObjectId: badOrganizationId,
          _executorId: `${_userId}`,
          _parentId: `${okrobjective._id}`
        }
      }
    }
    await okrobjectiveCtrl.validateBoundToObject(ctx, null)
    expect(ctx.state.params._parentId).toBeNull()
  })

  // 成员类型目标 _boundToObjectId 必须为 _executorId
  it('type member _boundToObjectId equal _executorId', async () => {
    let ctx = {
      state: {
        params: {
          _organizationId: `${_organizationId}`,
          boundToObjectType: 'member',
          _boundToObjectId: `${_userId}`,
          _executorId: `${_userId}`
        }
      }
    }
    await okrobjectiveCtrl.validateBoundToObject(ctx, null)
    expect(ctx.state.params._boundToObjectId).toBe(`${_userId}`)
  })

  it('update objective#ok', async () => {
    let objective = await db.okrobjective.create(
      mocker.okrobjective({ _organizationId })
    )
    let ctx = {
      state: {
        params: {
          _organizationId: `${_organizationId}`,
          _boundToObjectId: null
        },
        okrobjective: objective
      }
    }

    await okrobjectiveCtrl.validateBoundToObject(ctx, true)
    expect(ctx.state.params._boundToObjectId).toBe(objective._boundToObjectId)
    expect(ctx.state.params.boundToObjectType).toBe(objective.boundToObjectType)
  })
})
