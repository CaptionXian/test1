const _ = require('lodash')
const db = global.db
const ObjectId = require('mongoose').Types.ObjectId

const { mocker } = require('../tools/index')
const request = require('supertest')(global.server)

describe('okrobjective api', () => {
  let _organizationId, user
  beforeEach(async () => {
    _organizationId = ObjectId()
    user = mocker.user()
  })

  it('create okrobjective should be ok', async () => {
    let mockOkrobjective = mocker.okrobjective({
      _organizationId
    })

    const resp = await request
      .post(`/organizations/${_organizationId}/okrobjectives`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send(mockOkrobjective)
      .expect(200)

    const body = resp.body
    expect(body._organizationId).toBe(mockOkrobjective._organizationId)
  })

  it('get okrobjective should be ok', async () => {
    let okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId
      })
    )

    const resp = await request
      .get(`/organizations/${_organizationId}/okrobjectives`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    const body = resp.body
    expect(body).toHaveLength(1)
    expect(body[0]._id).toBe(`${okrobjective._id}`)
  })

  it('update okrobjective should be ok', async () => {
    let okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId
      })
    )

    const resp = await request
      .put(`/okrobjectives/${okrobjective._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        title: '233'
      })
      .expect(200)
    expect(resp.body.title).toBe('233')
  })

  it('update okrobjective suspend should be ok', async () => {
    let okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId
      })
    )

    const resp = await request
      .put(`/okrobjectives/${okrobjective._id}/suspend`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        note: '233',
        relatedUserIds: [mocker.user()._id]
      })
      .expect(200)
    expect(resp.body.isSuspended).toBe(true)
  })

  it('update okrobjective resume should be ok', async () => {
    let okrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId
      })
    )

    const resp = await request
      .put(`/okrobjectives/${okrobjective._id}/resume`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
    expect(resp.body.isSuspended).toBe(false)
  })

  it('delete okrobjective should be ok', async () => {
    let okrobjective = await db.okrobjective.create(mocker.okrobjective())

    await request
      .delete(`/okrobjectives/${okrobjective._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
  })

  it('update okrProgressMode should be ok', async () => {
    const resp = await request
      .put(`/organizations/${_organizationId}/okrProgressMode`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        okrProgressMode: 'manual'
      })
      .expect(200)

    const body = resp.body
    expect(body.okrProgressMode).toBe('manual')
  })

  it('get okrobjectives permissions should be ok', async () => {
    const resp = await request
      .get(`/organizations/${_organizationId}/okrobjectives/permissions`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    const body = resp.body
    expect(body).toMatchObject({
      organization: ['owner', 'admin'],
      team: ['owner', 'admin', 'teamMember'],
      member: ['member']
    })
  })

  it('update okrobjectives permissions should be ok', async () => {
    const boundToObjectType = 'organization'
    const resp = await request
      .put(
        `/organizations/${_organizationId}/okrobjectives/permissions/${boundToObjectType}`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        $del: ['admin']
      })
      .expect(200)

    const body = resp.body
    expect(body).toMatchObject({
      organization: ['owner']
    })
  })
})
