
const http = require('http')
var TLSSigAPIv2 = require('tls-sig-api-v2')

async function login(SDKAppID, userId, SECRETKEY) {
    return {
        userSig: new TLSSigAPIv2.Api(parseInt(SDKAppID), SECRETKEY).genSig(userId, 1 * 24 * 3600)
    }
}

module.exports = {
    login,
}
