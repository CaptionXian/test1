module.exports = Schema => ({
  Activity: require('./activity')(Schema),
  Okrobjective: require('./okrobjective')(Schema),
  Okrperiod: require('./okrperiod')(Schema),
  Okrconnection: require('./okrconnection')(Schema),
  Preference: require('./preference')(Schema),
  Okrassociation: require('./okrassociation')(Schema),
  Okrgradingstandard: require('./okrgradingstandard')(Schema),
  Okrremind: require('./okrremind')(Schema),
  Okrprogress: require('./okrprogress')(Schema),
  Okrcomment: require('./okrcomment')(Schema),
  Okrsuperadmin: require('./okrsuperadmin')(Schema),
  Permission: require('./permission')(Schema)
})
