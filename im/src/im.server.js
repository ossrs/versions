
const url = require('url')
const http = require('http')
const https = require('https')
const TLSSigAPIv2 = require('tls-sig-api-v2')

// The param SDKAppID is the sdkappid is of https://cloud.tencent.com/document/product/269/1519
// The param administrator is the identifier of https://cloud.tencent.com/document/product/269/1519
// The param SECRETKEY is used to generate the usersig of https://cloud.tencent.com/document/product/269/1519
function create(SDKAppID, SECRETKEY, administrator) {
  // TODO: FIMXE: Cache the sig util expired.
  administratorSig = function() {
    return new TLSSigAPIv2.Api(parseInt(SDKAppID), SECRETKEY).genSig(administrator, 1 * 24 * 3600)
  }

  // Do HTTP/HTTPS request.
  apiRequest  = async function (r, data) {
    const postData = JSON.stringify(data)
    const urlObj = url.parse(r)
    const m = (urlObj.protocol === 'http:')? http : https
  
    return await new Promise((resolve, reject) => {
      const req = m.request({
          method: 'POST',
          host: urlObj.host,
          path: urlObj.path,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          var body = '';
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            body += chunk
          })
          res.on('end', () => {
            resolve(body)
          })
        }
      )
  
      req.on('error', (e) => {
        reject(e)
      })
  
      req.write(postData)
      req.end()
    })
  }

  // Generate the request url by api.
  generateUrl = function(api) {
    return 'https://console.tim.qq.com/' + api + '?' 
      + 'sdkappid=' + SDKAppID + '&identifier=' + administrator + '&usersig=' + administratorSig()
      + '&random=' + parseInt(Math.random() * 1000000000) +'&contenttype=json'
  }

  // Export SDK API.
  return {
    // 导入单个帐号 @see https://cloud.tencent.com/document/product/269/1608
    account_import: async function(userId, nickName, faceUrl) {
      return apiRequest(generateUrl('v4/im_open_login_svc/account_import'), {
        "Identifier": userId,
        "Nick": nickName,
        "FaceUrl": faceUrl,
      })
    }
  }
}

module.exports = {
  create,
}
