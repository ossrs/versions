'use strict';

const admins = {};
admins[process.env.SRS_ADMIN] = process.env.SRS_PASSWORD;
admins[process.env.SRS_ADMIN1] = process.env.SRS_PASSWORD1;
admins[process.env.SRS_ADMIN2] = process.env.SRS_PASSWORD2;

exports.main_handler = async (event, context) => {
  const q = event.queryString;
  const body = event.body?  JSON.parse(event.body) : {};
  console.log(`db query ${event.path}, q=${JSON.stringify(q)}, body=${JSON.stringify(body)}`)

  // Create and update versions.
  if (event.path === '/db-internal/v1/versions') {
    if (!q.id || !q.version) {
      throw new Error('no id or version')
    }

    // Write event to SLS logstore.
    await slsTrace(q);

    return {id:q.id, rip: q.rip, fwd: q.fwd};
  }

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

// Write SLS log to srs-eggs, @see https://sls.console.aliyun.com/lognext/project/srs/logsearch/srs-eggs
async function slsTrace(data) {
  return await slsWriteLog(process.env.SLS_PROJECT, process.env.SLS_ENDPOINT, process.env.SLS_LOGSTORE, data);
  //return await slsWriteLog('srs', 'log-global.aliyuncs.com', 'srs-eggs', data);
}

// @see https://help.aliyun.com/document_detail/120218.htm#reference-354467
// @see https://help.aliyun.com/document_detail/31752.html#title-62w-ozs-fpy
async function slsWriteLog(project, host, logstore, log) {
  return new Promise((resolve, reject) => {
    // Retry if ECONNRESET which is closed by server, @see https://zhuanlan.zhihu.com/p/86953757
    const doRequest = function(retry, timeout) {
      // For example: http://srs.cn-beijing.log.aliyuncs.com/logstores/srs-eggs/track?APIVersion=0.6.0&id=100'
      const qs = require('querystring').stringify({
        APIVersion: '0.6.0',
        rand: Math.random().toString(16).slice(-8),
        ...log,
      });
      let api = `https://${project}.${host}/logstores/${logstore}/track?${qs}`;
      console.log(`sls request ${api}`);

      const http = require('https');
      http.get(api, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          resolve(body);
        });
      }).on('error', (e) => {
        if (e.code === 'ECONNRESET' && retry) {
          console.log(`retry code=${e.code}, retry=${retry}, timeout=${timeout}, e=${JSON.stringify(e)}`);
          setTimeout(doRequest, timeout, retry - 1, timeout * 2);
          return;
        }

        console.log(`err code=${e.code}, retry=${retry}, timeout=${timeout}, e=${JSON.stringify(e)}`);
        reject(e);
      });
    };

    doRequest(5, 500);
  });
}
