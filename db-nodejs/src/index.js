'use strict';

const admins = {};
admins[process.env.SRS_ADMIN] = process.env.SRS_PASSWORD;
admins[process.env.SRS_ADMIN1] = process.env.SRS_PASSWORD1;
admins[process.env.SRS_ADMIN2] = process.env.SRS_PASSWORD2;

exports.main_handler = async (event, context) => {
  const q = event.queryString;
  const body = event.body?  JSON.parse(event.body) : {};
  console.log(`db query ${event.path}, q=${JSON.stringify(q)}, body=${JSON.stringify(body)}`)

  // Admin user login.
  if (event.path === '/db-internal/v1/admins') {
    if (!q.user || !q.password) {
      throw new Error('no user or password')
    }

    const verify =  (Object.keys(admins).includes(q.user) && admins[q.user] === q.password);
    // TODO: FIXME: Write to CLS.
    return {user: q.user, verify: verify}
  }

  // Write syslog.
  if (event.path === '/db-internal/v1/logtrace') {
    // TODO: FIXME: Write to CLS.
    return null
  }

  // Query admin user lists.
  if (event.path === '/db-internal/v1/users') {
    return {users: Object.keys(admins)}
  }

  return event
}

