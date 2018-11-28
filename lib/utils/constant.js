/*
  'owner', 企业拥有者
  'admin', 企业管理员
  'member', 企业所有成员
  'teamLeader', 部门负责人
  'teamMember', 部门所有成员
*/
const DEFAULT_OKR_PERMISSIONS = {
  organization: ['owner', 'admin'],
  team: ['owner', 'admin', 'teamMember'],
  member: ['member']
}
const ENUM_PERMISSIONS = {
  organization: ['owner', 'admin', 'member', 'superAdmin', 'teamLeader', 'executor'],
  team: ['owner', 'admin', 'member', 'teamLeader', 'teamMember', 'superAdmin', 'executor'],
  member: ['owner', 'admin', 'member','superAdmin', 'teamLeader', 'executor'],
  update: ['member', 'superAdmin', 'teamLeader', 'executor'],
  grade: ['member', 'superAdmin','teamLeader','executor'],
  restart: ['member', 'superAdmin','teamLeader','executor']
}

const DEFAULT_ROLEMAP = {
  0: 'member',
  1: 'admin',
  2: 'owner'
}

/*
  新的权限架构，各类别目标分别设置其 查看、新建、编辑、评分 的权限
  并相应增加 应用管理员、 目标执行人 两个角色
  注：应用管理员有最高级别权限
  角色列表：
    'member', 企业所有成员
    'teamLeader', 团队负责人
    'teamMember', 团队所有成员
    'superAdmin', 应用管理员
    'executor', 目标执行人
*/

//  查看权限
const DEFAULT_GET_OKR_PERMISSIONS = {
  organization: ['superAdmin','teamLeader','executor'],
  team: ['superAdmin','teamLeader'],
  member: ['member']
}

//  新建权限
const DEFAULT_CREATE_OKR_PERMISSIONS = {
  organization: ['superAdmin','teamLeader','executor'],
  team: ['superAdmin','teamLeader'],
  member: ['member']
}

//  编辑权限
const DEFAULT_UPDATE_OKR_PERMISSIONS = {
  update: ['member'],
  grade: ['superAdmin','teamLeader','executor']
}

//  目标评分权限
const DEFAULT_GRADE_OKR_PERMISSIONS = {
  organization: ['superAdmin','teamLeader','executor'],
  team: ['superAdmin','teamLeader','executor'],
  member: ['superAdmin','teamLeader','executor']
}

//  其他权限
const DEFAULT_OTHER_OKR_PERMISSIONS = {
  restart: ['superAdmin','teamLeader','executor']
}

module.exports = {
  DEFAULT_OKR_PERMISSIONS,
  ENUM_PERMISSIONS,
  DEFAULT_ROLEMAP,
  DEFAULT_GET_OKR_PERMISSIONS,
  DEFAULT_CREATE_OKR_PERMISSIONS,
  DEFAULT_UPDATE_OKR_PERMISSIONS,
  DEFAULT_GRADE_OKR_PERMISSIONS,
  DEFAULT_OTHER_OKR_PERMISSIONS
}
