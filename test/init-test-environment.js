const sinon = require('sinon')
const nockTWSOrg = require('nock')(`http://localhost:31103`)
const nockTWSAuth = require('nock')(`http://localhost:31090`)
const NodeEnvironment = require('jest-environment-node')
const auth = require('../lib/middlewares/auth')
const { db } = require('../lib/services/mongo')

class InitEnvironment extends NodeEnvironment {
  async setup () {
    await super.setup()

    this.stub = sinon.stub(auth, 'verifyAccessToken').callsFake(() => {
      return {
        user: {
          _id: '5795ae606cf0ea9442c58083',
          name: 'abc'
        }
      }
    })

    nockTWSAuth
      .persist()
      .post('/v1/apps/authorize')
      .reply(200, {
        accessToken: 'some access token'
      })

    nockTWSOrg
      .persist()
      .get(
        /^\/v1\/organizations\/[a-f\d]{24}\/members:getByUser\?_userId=[a-f\d]{24}$/
      )
      .reply(200, {
        _id: '1111',
        _userId: '5acf1e2dff394772664f1df6',
        role: 2
      })
      .post(/^\/v1\/organizations\/[a-f\d]{24}\/members:batchGet$/)
      .reply(200, {
        result: [
          {
            _id: '1111',
            _userId: '5acf1e2dff394772664f1df6',
            role: 2
          }
        ]
      })
      .get(/^\/v1\/organizations\/[a-f\d]{24}\/teams$/)
      .reply(200, {
        result: [
          {
            _id: '5acf1e2dff394772664f1df8'
          }
        ]
      })
      .get(/^\/v1\/organizations\/[a-f\d]{24}\/teams\/[a-f\d]{24}$/)
      .reply(200, {
        _id: '5acf1e2dff394772664f1df8'
      })
      .get(/^\/v1\/organizations\/[a-f\d]{24}\/teams\/[a-f\d]{24}\/members/)
      .reply(200, {
        result: [
          {
            _id: '111',
            _userId: '5acf1e2dff394772664f1df6'
          }
        ]
      })

    this.global.server = await require('../lib/app')
    this.global.db = db
  }

  async teardown () {
    this.stub.restore()

    await this.global.server.close()
    await super.teardown()
  }

  runScript (script) {
    return super.runScript(script)
  }
}

module.exports = InitEnvironment
