'use strict'

const db = require('./db')

exports.main_handler = async (event, context) => {
  const q = event.queryString
  const body = event.body && JSON.parse(event.body)
  console.log(`db query ${event.path}, q=`, q, `, body=`, body)

  // Create and update versions.
  if (event.path === '/db/v1/versions') {
    if (!q.id || !q.version) {
      throw new Error('no id or version')
    }

    // Get the id if not exists.
    const [exits] = await db.query('SELECT id FROM versions WHERE id=? LIMIT 1', [String(q.id)])

    // Create the SRS server information if not exists.
    if (!exits.length) {
      await db.query('INSERT INTO versions(id) VALUES(?)', [String(q.id)])
    }

    // Update the SRS server information.
    const res = event.res || {}
    const [rows] = await db.query(`
      UPDATE 
        versions 
      SET 
        version=?, ts=?, eip=?, rip=?, 
        match_version=?, stable_version=? 
      WHERE 
        id=?
      `, 
      [
        q.version, q.ts, q.eip, q.rip,
        res.match_version, res.stable_version,
        String(q.id)
      ],
    )
    return {id:q.id, count:0}
  }

  return event
}
