const db = global.db
const ObjectId = require('mongoose').Types.ObjectId

const { mocker } = require('../tools/index')
const request = require('supertest')(global.server)

describe('okrkeyresult API', () => {
  let user, userB, organization, okrobjective, okrkeyresult

  beforeEach(async () => {
    user = mocker.user()
    userB = mocker.user()
    organization = {
      _id: ObjectId()
    }

    okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId: organization._id,
        _executorId: user._id, // 必须为企业成员
        boundToObjectType: 'member',
        _boundToObjectId: user._id // 成员目标, 必须同 _executorId 一致
      })
    )

    okrkeyresult = await db.okrkeyresult.create(
      mocker.okrkeyresult({
        _okrObjectiveId: okrobjective._id
      })
    )
  })

  it('create: got 400 if no required fields', async () => {
    await request
      .post(`/okrobjectives/${okrobjective._id}/okrkeyresults`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(400)

    await request
      .post(`/okrobjectives/${okrobjective._id}/okrkeyresults`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(400)
  })

  it('create', async () => {
    let res = await request
      .post(`/okrobjectives/${okrobjective._id}/okrkeyresults`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({ okrkeyresults: [mocker.okrkeyresult()] })
      .expect(200)
    expect(res.body.length).toBe(1)
    okrkeyresult = res.body[0]
    expect(okrkeyresult._okrObjectiveId).toBe(`${okrobjective._id}`)
  })

  it('get', async () => {
    let res = await request
      .get(`/okrobjectives/${okrobjective._id}/okrkeyresults`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    expect(res.body.length).toBe(1)
    expect(res.body[0].title).toBe(okrkeyresult.title)
  })

  it('update', async () => {
    let res = await request
      .put(`/okrkeyresults/${okrkeyresult._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({ title: 'kr-002' })
      .expect(200)
    expect(res.body.title).toBe('kr-002')
  })

  it('update: okrobjective executor has permission to edit okrkeyresult', async () => {
    // set okrobjective executor userB
    let res = await request
      .put(`/okrobjectives/${okrobjective._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({ _executorId: userB._id })
      .expect(200)
    expect(res.body._executorId).toBe(`${userB._id}`)

    // userB edit
    res = await request
      .put(`/okrkeyresults/${okrkeyresult._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({ title: 'kr-003' })
      .expect(200)

    expect(res.body.title).toBe('kr-003')
  })

  it('update measure', async () => {
    let measure = {
      mode: 'numeric',
      initial: 300,
      target: 500,
      current: 400,
      unit: '万用户'
    }
    let res = await request
      .put(`/okrkeyresults/${okrkeyresult._id}/measure`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send(measure)
      .expect(200)
    expect(res.body.measure.mode).toBe(measure.mode)
    let progress = Math.round((400 - 300) / (500 - 300) * 100)
    expect(res.body.progress).toBe(progress)
  })

  it('suspend', async () => {
    let res = await request
      .put(`/okrkeyresults/${okrkeyresult._id}/suspend`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        relatedUserIds: [user._id],
        note: 'suspend kr'
      })
      .expect(200)
    expect(res.body.isSuspended).toBe(true)
    expect(res.body.relatedUserIds.length).toBe(1)
    expect(res.body.relatedUserIds[0]).toBe(`${user._id}`)
  })

  it('resume', async () => {
    let res = await request
      .put(`/okrkeyresults/${okrkeyresult._id}/resume`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
    expect(res.body.isSuspended).toBe(false)
  })

  it('delete', async () => {
    let res = await request
      .delete(`/okrkeyresults/${okrkeyresult._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    res = await request
      .get(`/okrobjectives/${okrobjective._id}/okrkeyresults`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
    expect(res.body.length).toBe(0)
  })
})
