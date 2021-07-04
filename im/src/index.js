'use strict';

const im = require('./im.server')
const TLSSigAPIv2 = require('tls-sig-api-v2')
const sdk = im.create(process.env.IM_SDKAPPID, process.env.IM_SECRETKEY, process.env.IM_ADMINISTRATOR)

exports.main_handler = async (event, context) => {
    const q = event.queryString
    console.log("Hello World", event, q)

    if (event.path === '/im-service/v1/login') {
        return {
            user_id: q.user,
            user_sig: new TLSSigAPIv2.Api(parseInt(process.env.IM_SDKAPPID), process.env.IM_SECRETKEY).genSig(q.user, 1 * 24 * 3600),
            res: await sdk.account_import(q.user, q.nickName, q.faceUrl),
        }
    }

    return event
};
