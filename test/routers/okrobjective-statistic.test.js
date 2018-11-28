const _ = require('lodash')
const db = global.db
const ObjectId = require('mongoose').Types.ObjectId

const { mocker } = require('../tools/index')
const request = require('supertest')(global.server)

describe('okr statistic API', () => {
  let user, _organizationId, _teamId, period, o1, o2, kr1, kr2
  let o1MeanProgress, o2MeanProgress
  let stub

  /*
    目标及对应关键结果的 进度 和 权重 如下:
    O1 progress: 10
      KR1 progress: 30, weight: 5
      KR2 progress: 60, weight: 10
    O2 progress: 20
  */
  beforeAll(async () => {
    user = mocker.user()
    // 创建企业
    _organizationId = ObjectId()
    _teamId = '5acf1e2dff394772664f1df8'
    user._id = '5acf1e2dff394772664f1df6'

    // 创建周期 period
    period = await db.okrperiod.create(
      mocker.okrperiod({
        _organizationId: _organizationId,
        startDate: new Date('2017-08-01T00:00:00.000Z'),
        endDate: new Date('2017-08-31T23:59:59.999Z')
      })
    )

    // 创建目标 o1, o2
    o1 = await db.okrobjective.create(
      mocker.okrobjective({
        progress: 10,
        _organizationId: _organizationId,
        boundToObjectType: 'team',
        _boundToObjectId: _teamId,
        _executorId: user._id,
        _okrPeriodId: period._id,
        _creatorId: user._id
      })
    )
    o2 = await db.okrobjective.create(
      mocker.okrobjective({
        progress: 20,
        _organizationId: _organizationId,
        boundToObjectType: 'organization',
        _boundToObjectId: _organizationId,
        _executorId: user._id,
        _okrPeriodId: period._id,
        _creatorId: user._id
      })
    )

    // 为 o1 创建关键结果 kr1, kr2
    kr1 = await db.okrkeyresult.create(
      mocker.okrkeyresult({
        _okrObjectiveId: o1._id,
        progress: 30,
        weight: 5,
        _creatorId: user._id
      })
    )
    kr2 = await db.okrkeyresult.create(
      mocker.okrkeyresult({
        _okrObjectiveId: o1._id,
        progress: 60,
        weight: 10,
        _creatorId: user._id
      })
    )

    // 目标平均进度, 关键结果加权平均
    o1MeanProgress =
      (kr1.progress * kr1.weight + kr2.progress * kr2.weight) /
      (kr1.weight + kr2.weight)
    o2MeanProgress = 0
  })

  afterAll(() => {
    stub.restore()
  })

  // 不加筛选条件, 获取企业下所有目标的统计
  it('get statistic', async () => {
    let resp = await request
      .get(`/organizations/${_organizationId}/okrobjectives/statistic`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)

    let result = resp.body

    expect(result.count).toBe(2)
    expect(result.progress).toBe(
      Math.round(_.sum([o1.progress, o2.progress]) / 2)
    )
    expect(result.meanProgress).toBe(
      Math.round(_.sum([o1MeanProgress, o2MeanProgress]) / 2)
    )
  })

  it('get statistic filter by boundToObjectType', async () => {
    // 类型为 团队
    let boundToObjectType = 'team'
    let res = await request
      .get(
        `/organizations/${_organizationId}/okrobjectives/statistic?boundToObjectType=${boundToObjectType}`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({})
      .expect(200)
    let result = res.body
    expect(result.count).toBe(1)
    expect(result.progress).toBe(o1.progress)
    expect(result.meanProgress).toBe(o1MeanProgress)

    // 类型为 企业
    boundToObjectType = 'organization'
    res = await request
      .get(
        `/organizations/${_organizationId}/okrobjectives/statistic?boundToObjectType=${boundToObjectType}`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({})
      .expect(200)
    result = res.body
    expect(result.count).toBe(1)
    expect(result.progress).toBe(o2.progress)
    expect(result.meanProgress).toBe(o2MeanProgress)
  })

  it('get statistic filter by startDate and endDate', async () => {
    // 日期和区间有交集
    let startDate = '2017-08-15T00:00:00.000Z'
    let endDate = '2017-09-15T00:00:00.000Z'
    let res = await request
      .get(
        `/organizations/${_organizationId}/okrobjectives/statistic?startDate=${startDate}&endDate=${endDate}`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
    let result = res.body
    expect(result.count).toBe(2)
    expect(result.progress).toBe(
      Math.round(_.sum([o1.progress, o2.progress]) / 2)
    )
    expect(result.meanProgress).toBe(
      Math.round(_.sum([o1MeanProgress, o2MeanProgress]) / 2)
    )
  })

  // o1 为团队类型目标
  it('get statistic-for-teams', async () => {
    let res = await request
      .get(
        `/organizations/${_organizationId}/okrobjectives/statistic-for-teams`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
    let result = res.body
    expect(result.length).toBe(1)
    expect(result[0].count).toBe(1)
    expect(result[0].progress).toBe(o1.progress)
    expect(result[0].meanProgress).toBe(o1MeanProgress)
  })

  // o1, o2 的执行人 user 为部门 team 的成员, 所以都为部门成员目标
  it('get statistic-for-team-members', async () => {
    let res = await request
      .get(
        `/organizations/${_organizationId}/okrobjectives/statistic-for-team-members?_teamId=${_teamId}`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    let result = res.body
    expect(result.length).toBe(1)
    expect(result[0].count).toBe(2)
    expect(result[0].progress).toBe(
      Math.round(_.sum([o1.progress, o2.progress]) / 2)
    )
    expect(result[0].meanProgress).toBe(
      Math.round(_.sum([o1MeanProgress, o2MeanProgress]) / 2)
    )
  })
})
