const { createPool } = require('mysql2/promise');

global.mysqlPool;

const initialize = async () => {
  if (global.mysqlPool) {
    return global.mysqlPool;
  }

  global.mysqlPool = await createPool({
      host : process.env.MYSQL_HOST,
      port : process.env.MYSQL_PORT,
      user : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
  });
  
  await global.mysqlPool.query(`CREATE DATABASE IF NOT EXISTS srs_version;`);
  await global.mysqlPool.query(`USE srs_version;`);
  
  // 初始化表格
  await global.mysqlPool.query(`CREATE TABLE IF NOT EXISTS conns(
      id          VARCHAR(40) DEFAULT NULL,
      wsBackUrl   VARCHAR(1024) DEFAULT NULL
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`);
  return global.mysqlPool;
};

async function query(sql, values) {
  const pool = await initialize();
  const cmdSql = pool.format(sql, values);
  console.log(`[Query]: ${cmdSql}`);
  return pool.query(cmdSql);
}

module.exports = {
  query,
};
