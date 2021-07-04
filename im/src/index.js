'use strict';

const im = require('./im.server')
const TLSSigAPIv2 = require('tls-sig-api-v2')
const SDKAppID = parseInt(process.env.IM_SDKAPPID)
const sdk = im.create(SDKAppID, process.env.IM_SECRETKEY, process.env.IM_ADMINISTRATOR)

exports.main_handler = async (event, context) => {
    const q = event.queryString
    console.log("Hello World", event, q)

    if (event.path === '/im-service/v1/login') {
        // Register as IM user, nickName and faceUrl is optional.
        await sdk.account_import(q.user, q.nickName, q.faceUrl)

        return {
            SDKAppID: SDKAppID,
            userID: q.user,
            userSig: new TLSSigAPIv2.Api(SDKAppID, process.env.IM_SECRETKEY).genSig(q.user, 1 * 24 * 3600),
        }
    }

    return event
};
