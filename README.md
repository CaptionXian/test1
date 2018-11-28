## 环境
node: V8.11.3
mongodb: V3.4

## 系统架构
-  bin      //  脚本文件
-  config   //  配置文件
-  lib
 -   controllers    //  控制器
 -   middlewares    //  中间件
 -   models         //  数据模型
 -   observers      //  hook
 -   public         //  静态资源
 -   routers        //  路由
 -   services       //  系统服务函数
 -   utils          //  工具函数
 -   app.js         //  入口文件
- locales   //  语言包
- pm2       //  pm2配置文件
- test      //  测试文件
- package.json

## API权限控制
所有API都需要用户携带相应的 Token 来走 Auth 流程校验身份 ( 规定必须是企业成员 )  
*特别的：获取版本号 和 Token 的接口无需携带 Token  ( /(version)?,  /token  )*

## 配置修改 /config/default.yml
端口：port  
授权应用ID：client_id  
授权应用秘钥：client_secret

## Setup
npm install

## Start
npm start