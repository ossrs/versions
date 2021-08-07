'use strict'

const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')

const stableDocker2 = "v2.0-r10"
const stableVersion2 = "2.0.274"
const stableDocker3 = "v3.0-r7"
const stableVersion3 = "3.0.164"
const stableDocker4 = "v4.0.139"
const stableVersion4 = "v4.0.139"

const dockerImage = "ossrs/srs"
const dockerMirror = "registry.cn-hangzhou.aliyuncs.com/ossrs/srs"

exports.main_handler = async (event, context) => {
  let q = event.queryString || {}
  let version = q.version? q.version :  "v0.0.0"

  // Parse headers to lower case.
  event.headers = event.headers || {}
  Object.keys(event.headers).map(e => {
    event.headers[e.toLowerCase()] = event.headers[e];
  });
  console.log(`api q=${JSON.stringify(q)}, headers=${JSON.stringify(event.headers)}`);

  // Transform version to vx.x.x
  if (version.indexOf('v') !== 0) {
    version = "v" + version
  }
  if (version.indexOf('.') === -1) {
    version += ".0.0"
  }

  // Build response.
  let res = {
    stable_version: stableVersion3,
    stable_docker: stableDocker3,
  }

  if (version.indexOf('v2.') === 0) {
    res.match_version = stableVersion2
    res.match_docker = stableDocker2
  } else if (version.indexOf('v3.') === 0) {
    res.match_version = stableVersion3
    res.match_docker = stableDocker3
  } else if (version.indexOf('v4.') === 0) {
    res.match_version = stableVersion4
    res.match_docker = stableDocker4
  } else if (version.indexOf('v5.') === 0) {
    res.match_version = stableVersion4
    res.match_docker = stableDocker4
  } else {
    res.match_version = stableVersion3
    res.match_docker = stableDocker3
  }
  res.match_docker_image = dockerImage + ':' + res.match_docker
  res.match_docker_mirror = dockerMirror + ':' + res.match_docker
  res.stable_docker_image = dockerImage + ':' + res.stable_docker
  res.stable_docker_mirror = dockerMirror + ':' + res.stable_docker

  // See GetOriginalClientIP of https://github.com/winlinvip/http-gif-sls-writer/blob/master/main.go
  q.rip = getOriginalClientIP(q, event.headers, event.requestContext);
  q.fwd = event.headers['x-forwarded-for'];

  // Add the feed back address.
  if (q.feedback) {
    res.addr = {rip: q.rip, fwd: r.fwd};
  }

  // Call the im-service SCF to notify all users.
  let r1 = null
  if (q.id && q.version) {
    let r = r1 = await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
        path: '/im-internal/v1/send_group_msg', queryString: {to:process.env.IM_GROUP_SYSLOG},
        body: JSON.stringify({msg: JSON.stringify({api: new Date().getTime(), q: q, res: res})}),
      }})

    // Modify the response body of api-service SCF.
    let rr = r.Result && r.Result.RetMsg && JSON.parse(r.Result.RetMsg)
    if (q.feedback) res.im = (!rr || rr.errorCode)? null : rr
  }

  console.log(`SRS id=${q.id}, version=${version}, eip=${q.eip}, rip=${q.rip}, fwd=${q.fwd}, res=${JSON.stringify(res)}, scf r1=${JSON.stringify(r1)}`)
  return res
}

// See GetOriginalClientIP of https://github.com/winlinvip/http-gif-sls-writer/blob/master/main.go
function getOriginalClientIP(q, headers, context) {
  if (q && q.clientip) return q.clientip;

  const fwd = headers && headers['x-forwarded-for'];
  if (fwd) {
    const index = fwd.indexOf(',')
    if (index != -1) return fwd.substr(0, index);
    return fwd;
  }

  const rip = headers && headers['x-real-ip'];
  if (rip) return rip;

  return context && context.sourceIp;
}

