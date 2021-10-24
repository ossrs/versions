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
  // Filter the querystring.
  let {q, version} = filterVersion(event);

  // Parse headers to lower case.
  filterHeaders(event);
  console.log(`api q=${JSON.stringify(q)}, headers=${JSON.stringify(event.headers)}`);

  // Build response.
  let res = buildVersion(q, version);
  buildFeatures(q, version, res);

  // See GetOriginalClientIP of https://github.com/winlinvip/http-gif-sls-writer/blob/master/main.go
  q.rip = getOriginalClientIP(q, event.headers, event.requestContext);
  q.fwd = event.headers['x-forwarded-for'];

  // Add the feed back address.
  if (q.feedback) {
    res.addr = {rip: q.rip, fwd: q.fwd};
  }

  // Call the im-service SCF to notify all users.
  let r1 = await im_broadcast(q, res);

  console.log(`SRS id=${q.id}, version=${version}, eip=${q.eip}, rip=${q.rip}, fwd=${q.fwd}, res=${JSON.stringify(res)}, scf r1=${JSON.stringify(r1)}`)
  return res
}

// Build the version and docker image url.
function buildVersion(q, version) {
  const res = {
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

  return res;
}

// Build features query.
function buildFeatures(q, version, res) {
  if (q.docker) res.docker = 'stable'; // Run by Docker
  if (q.api) res.api = 'stable'; // System HTTP-API
  if (q.forward) res.forward = 'stable'; // Foward to other RTMP servers
  if (q.ingest) res.ingest = 'stable'; // Use FFmpeg to ingest streams
  if (q.edge) res.edge = 'stable'; // RTMP/FLV edge cluster
  if (q.oc) res.oc = 'stable'; // RTMP/FLV origin cluster
  if (q.hls) res.hls = 'stable'; // HLS live streaming
  if (q.dvr) res.dvr = 'stable'; // DVR to VoD files
  if (q.flv) res.flv = 'stable'; // HTTP-FLV live streaming
  if (q.hooks) res.hooks = 'stable'; // HTTP Callbacks(Hooks)
  if (q.x86) res.x86 = 'stable'; // For amd64, x86_64, i386 arch.

  if (q.cross) res.cross = 'dev'; // HTTP CORS(Cross Origin Resource Sharing)
  if (q.rtc) res.rtc = 'dev'; // WebRTC SFU
  if (q.srt) res.srt = 'dev'; // SRT(Secure Reliable Transport)
  if (q.https) res.https = 'dev'; // HTTPS API, live streaming and callback
  if (q.raw) res.raw = 'dev'; // HTTP RAW API
  if (q.flv2) res.flv2 = 'dev'; // StreamCaster: Push FLV.
  if (q.dash) res.dash = 'dev'; // MPEG-DASH live streaming
  if (q.exec) res.exec = 'dev'; // Exec program when publish
  if (q.transcode) res.transcode = 'dev'; // Use FFmpeg to transcode
  if (q.security) res.security = 'dev'; // Referer and IP Security
  if (q.arm) res.arm = 'dev'; // For arm, aarch64 arch.
  if (q.mips) res.mips = 'dev'; // For mips arch.
  if (q.loong) res.loong = 'dev'; // For Loongson arch.

  if (q.sip) res.sip = 'feature'; // SIP of GB28181
  if (q.gb28181) res.gb28181 = 'feature'; // StreamCaster: Push GB28181
  if (q.las) res.las = 'feature'; // https://las-tech.org.cn
  if (q.h265) res.h265 = 'feature'; // H.265 codec
  if (q.simulcast) res.simulcast = 'feature'; // WebRTC simulcast
  if (q.sctp) res.sctp = 'feature'; // WebRTC DataChannel
  if (q.g711) res.g711 = 'feature'; // WebRTC G.711

  if (q.hds) res.hds = 'deprecated'; // Adobe HDS live streaming
  if (q.rtsp) res.rtsp = 'deprecated'; // StreamCaster: Push RTSP
}

// Filter the version from querystring.
function filterVersion(event) {
  let q = event.queryString || {}

  let version = q.version? q.version :  "v0.0.0"
  if (version.indexOf('v') !== 0) {
    version = "v" + version
  }
  if (version.indexOf('.') === -1) {
    version += ".0.0"
  }

  return {q, version};
}

// Broadcast by IM.
async function im_broadcast(q, res) {
  return null;

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

  return r1;
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

// Filter headers.
function filterHeaders(event) {
  event.headers = event.headers || {}
  Object.keys(event.headers).map(e => {
    event.headers[e.toLowerCase()] = event.headers[e];
  });
}

