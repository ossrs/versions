'use strict';

const stableDocker2 = "v2.0-r10";
const stableVersion2 = "2.0.274";
const stableDocker3 = "v3.0-r7";
const stableVersion3 = "3.0.164";
const stableDocker4 = "v4.0-b1";
const stableVersion4 = "4.0.206";

const dockerImage = "ossrs/srs";
const dockerMirror = "registry.cn-hangzhou.aliyuncs.com/ossrs/srs";

// Build the version and docker image url.
function buildVersion(q, version) {
  const res = {
    stable_version: stableVersion4,
    stable_docker: stableDocker4,
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
    res.match_version = stableVersion4
    res.match_docker = stableDocker4
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

// See GetOriginalClientIP of https://github.com/winlinvip/http-gif-sls-writer/blob/master/main.go
function getOriginalClientIP(q, headers, sourceIp) {
  if (q && q.clientip) return q.clientip;

  const fwd = headers && headers['x-forwarded-for'];
  if (fwd) {
    const index = fwd.indexOf(',')
    if (index !== -1) return fwd.substr(0, index);
    return fwd;
  }

  const rip = headers && headers['x-real-ip'];
  if (rip) return rip;

  return sourceIp;
}

// Filter headers.
function filterHeaders(event) {
  event.headers = event.headers || {}
  Object.keys(event.headers).map(e => {
    event.headers[e.toLowerCase()] = event.headers[e];
  });
}

exports.handle = (ctx) => {
  // Filter the querystring.
  let {q, version} = filterVersion({
    queryString: ctx.request.query
  });

  // Parse headers to lower case.
  filterHeaders({
    headers: ctx.headers,
  });
  console.log(`api q=${JSON.stringify(q)}, headers=${JSON.stringify(ctx.headers)}`);

  // Build response.
  let res = buildVersion(q, version);
  buildFeatures(q, version, res);

  // See GetOriginalClientIP of https://github.com/winlinvip/http-gif-sls-writer/blob/master/main.go
  q.rip = getOriginalClientIP(q, ctx.headers, ctx.request.ip);
  q.fwd = ctx.headers['x-forwarded-for'];

  // Add the feed back address.
  if (q.feedback) {
    res.addr = {rip: q.rip, fwd: q.fwd};
  }

  console.log(`SRS id=${q.id}, version=${version}, eip=${q.eip}, rip=${q.rip}, fwd=${q.fwd}, res=${JSON.stringify(res)}`);
  ctx.body = res;
};

