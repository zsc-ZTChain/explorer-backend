const Sequelize = require("sequelize");
const config = require('config')
const Redis = require('ioredis')
const mysqlConfig = config.get('mysql')
const redisConfig = config.get('redis')
const mysql = require("mysql")

const dbPool = new Sequelize(mysqlConfig.database, mysqlConfig.username, mysqlConfig.password, mysqlConfig);
const redis = new Redis(redisConfig)

const mysqlDb = mysql.createConnection({
  host: mysqlConfig.host,
  user: mysqlConfig.username,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  multipleStatements: true
});
mysqlDb.connect()
module.exports = {dbPool, redis, mysqlDb}
