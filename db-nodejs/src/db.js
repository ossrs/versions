'use strict'

const mysql = require('mysql2/promise')

global.initialized

const initialize = async () => {
  if (global.initialized) {
    return
  }
  global.initialized = true

  const conn = await mysql.createConnection({
      host : process.env.MYSQL_HOST,
      port : process.env.MYSQL_PORT,
      user : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
  })

  try {
    await conn.connect()
    await conn.query("CREATE DATABASE IF NOT EXISTS " + process.env.MYSQL_DB)
    await conn.query("USE " + process.env.MYSQL_DB)
    
    // @see https://blog.csdn.net/weter_drop/article/details/89924451
    await conn.query(`
      CREATE TABLE IF NOT EXISTS versions (
        id varchar(64) NOT NULL COMMENT "SRS server id",
        version varchar(16) DEFAULT NULL COMMENT "SRS server current version",
        match_version varchar(16) DEFAULT NULL COMMENT "SRS server matched version",
        stable_version varchar(16) DEFAULT NULL COMMENT "SRS server stable version",
        eip varchar(256) DEFAULT NULL COMMENT "SRS local eip(public ip), by SRS",
        rip varchar(256) DEFAULT NULL COMMENT "SRS real eip(internet ip), by SCF",
        ts varchar(32) DEFAULT NULL COMMENT "SRS server current timestamp",
        create_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "Create datetime",
        update_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "Last update datetime",
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `)
  } finally {
    conn.end()
  }
}

async function query(sql, values) {
  const conn = await mysql.createConnection({
      host : process.env.MYSQL_HOST,
      port : process.env.MYSQL_PORT,
      user : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
  })

  try {
    await conn.connect()
    await conn.query("USE " + process.env.MYSQL_DB)
    return await conn.query(sql, values)
  } finally {
    conn.end()
  }
}

module.exports = {
  query,
}
