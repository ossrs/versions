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

    // Create DB.
    await conn.query("CREATE DATABASE IF NOT EXISTS " + process.env.MYSQL_DB)
    await conn.query("USE " + process.env.MYSQL_DB)
    
    // Create versions table.
    // @see https://blog.csdn.net/weter_drop/article/details/89924451
    await conn.query(`
      CREATE TABLE IF NOT EXISTS versions (
        id varchar(64) NOT NULL COMMENT "SRS server id",
        version varchar(16) DEFAULT NULL COMMENT "SRS server current version",
        role varchar(32) DEFAULT NULL COMMENT "This is who: srs(server), h5(page of ossrs.net)",
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

    // Create admin table.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        userName varchar(64) NOT NULL COMMENT "Admin user name",
        password varchar(128) DEFAULT NULL COMMENT "Admin password",
        token varchar(128) DEFAULT NULL COMMENT "User temporary login token",
        create_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "Create datetime",
        update_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "Last update datetime",
        PRIMARY KEY (userName)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `)

    // Create and update user.
    await conn.query(
      'REPLACE INTO admins(userName, password) VALUES(?, ?),(?, ?),(?, ?)', [
        String(process.env.SRS_ADMIN), String(process.env.SRS_PASSWORD),
        String(process.env.SRS_ADMIN1), String(process.env.SRS_PASSWORD1),
        String(process.env.SRS_ADMIN2), String(process.env.SRS_PASSWORD2),
      ]
    )

    // Create syslog for login and logout.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS logtrace (
        id bigint NOT NULL AUTO_INCREMENT,
        level varchar(16) DEFAULT NULL COMMENT "Log level: trace, warn, error",
        module varchar(16) DEFAULT NULL COMMENT "Log module, defined by user",
        event varchar(16) DEFAULT NULL COMMENT "Log event, defined by user",
        msg varchar(1024) DEFAULT NULL COMMENT "Log description",
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
  await initialize()

  const conn = await mysql.createConnection({
      host : process.env.MYSQL_HOST,
      port : process.env.MYSQL_PORT,
      user : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
  })

  try {
    await conn.connect()
    return await conn.query(sql, values)
  } finally {
    conn.end()
  }
}

module.exports = {
  query,
}
