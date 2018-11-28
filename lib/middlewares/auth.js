const config = require('config')
const { createErr } = require('http-errors')
const unless = require('koa-unless')

const SESSION_NAME = config.SESSION.NAME
const SESSION_NAME_SIG = SESSION_NAME + '.sig'

const twsAuthClient = require('../services/tws-auth').client

const auth = {}

auth.getAccessToken = req => {
  let token = req.get('authorization')
  if (token) return token.replace(/^OAuth2 /, '')
  if (req.query.access_token) return req.query.access_token
  return null
}

auth.hasSession = req => req.cookies.get(SESSION_NAME)

auth.verifyAccessToken = async req => {
  let accessToken = auth.getAccessToken(req)
  if (!accessToken) throw new Error('not access_token')
  try {
    let result = await twsAuthClient.user.verifyToken(accessToken)
    if (result && result.user && result.client) {
      return { user: result.user }
    } else {
      throw new Error('unknown error')
    }
  } catch (err) {
    throw createErr('InvalidAccessToken')
  }
}

auth.verifyCookie = async ctx => {
  let sessionId = ctx.cookies.get(SESSION_NAME)
  let sessionSig = ctx.cookies.get(SESSION_NAME_SIG)

  try {
    let result = await twsAuthClient.user.verifyCookie(sessionId, sessionSig)
    if (result && result.user) {
      return { user: result.user }
    } else {
      throw new Error('unknown error')
    }
  } catch (err) {
    throw createErr('InvalidCookie')
  }
}

auth.authMiddleware = async (ctx, next) => {
  let user
  if (auth.getAccessToken(ctx)) {
    let result = await auth.verifyAccessToken(ctx)
    user = result.user
    user.token = await auth.getAccessToken(ctx) //  带token给开发API调用
  } else if (auth.hasSession(ctx)) {
    let result = await auth.verifyCookie(ctx)
    user = result.user
    user.token = await auth.getAccessToken(ctx) //  带token给开发API调用
  }
  if (!user) throw createErr(401)
  if (user.isBlock) throw createErr(403)
  ctx.state.user = user
  await next()
}

auth.authMiddleware.unless = unless
module.exports = auth
