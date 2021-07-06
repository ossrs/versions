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
  let q = event.queryString
	let version = q.version? q.version :  "v0.0.0"

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

  q.rip = event.headers && event.headers['X-Forwarded-For']

  // Call the db-service SCF to write to MySQL.
  const scf = new SDK()
  const r0 = await scf.invoke({
    functionName: process.env.DB_SERVICE, 
    logType: LogType.Tail,
    data: {
      path: '/db/v1/versions',
      queryString: q,
      res: res,
    }
  })

  // Modify the response body of api-service SCF.
  const r1 = r0.Result && r0.Result.RetMsg && JSON.parse(r0.Result.RetMsg)
  res.db = (!r1 || r1.errorCode)? null : r1
  console.log(`SRS id=${q.id}, version=${version}, eip=${q.eip}, rip=${q.rip}, res=`, res, ', scf=', r0, ', by', event)

  return res
}
