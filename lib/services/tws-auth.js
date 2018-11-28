const config = require('config')

const AuthClient = require('tws-auth')
const RedisCache = require('tws-auth/lib/cache/redis')
const MemoryCache = require('tws-auth/lib/cache/memory')

const options = {
  host: config.TWS.AUTH.URL,
  timeout: 5000,
  appId: config.TWS.APP_ID,
  appSecret: config.TWS.AUTH.SECRET,
  cacheStore: new RedisCache(
    {
      addrs: config.REDIS
    },
    config.TWS.AUTH.CACHE_PREFIX
  ),
  maxSockets: config.TWS.AUTH.MAX_SOCKETS
}

if (/test/.test(process.env.NODE_ENV)) {
  options.cacheStore = new MemoryCache()
}

const twsAuthClient = new AuthClient(options)
exports.client = twsAuthClient

exports.getAppToken = (_resourceId, resourceType) => {
  return twsAuthClient.user.authorize(_resourceId, resourceType)
}
