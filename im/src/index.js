'use strict';

const im = require('./im.server')
const TLSSigAPIv2 = require('tls-sig-api-v2')
const sha256 = require('js-sha256').sha256
const SDKAppID = parseInt(process.env.IM_SDKAPPID)
const sdk = im.create(SDKAppID, process.env.IM_SECRETKEY, process.env.IM_ADMINISTRATOR)

exports.main_handler = async (event, context) => {
    const q = event.queryString
    if (event.path === '/im-service/v1/callback') {
        const body = JSON.parse(event.body)
        const res = {"ActionStatus": "OK", "ErrorCode": 0, "ErrorInfo": ""}

        console.log("Handle im", event.path, ", q=", q, ", body=", body, ", res=", res, ", event=", event)
        return res
    }

    let res = null
    if (event.path === '/im-service/v1/login') {
        res = {
            SDKAppID: SDKAppID,
            userID: q.user,
            userSig: new TLSSigAPIv2.Api(SDKAppID, process.env.IM_SECRETKEY).genSig(q.user, 1 * 24 * 3600),
            im: await sdk.account_import(q.user, q.nickName, q.faceUrl), 
        }
    } else if (event.path === '/im-service/v1/create_room') {
        res = {
            im: await sdk.create_group(q.user, sdk.TYPES.GRP_MEETING, q.id, q.id),
        }
    } else if (event.path === '/im-service/v1/delete_room') {
        res = {
            im: await sdk.destroy_group(q.id),
        }
    } else if (event.path === '/im-service/v1/join_room') {
        res = {
            im: await sdk.add_group_member(q.id, 1, [q.user]),
        }
    } else if (event.path === '/im-service/v1/leave_room') {
        res = {
            im: await sdk.delete_group_member(q.id, 1, [q.user]),
        }
    } else if (event.path === '/im-service/v1/change_owner') {
        res = {
            im: await sdk.change_group_owner(q.id, q.user),
        }
    } else if (event.path === '/im-service/v1/sendmsg') {
        const body = JSON.parse(event.body)
        res = {
            im: await sdk.sendmsg(q.from, 2, q.to, body.msg),
        }
    } else if (event.path === '/im-service/v1/send_group_msg') {
        const body = JSON.parse(event.body)
        res = {
            im: await sdk.send_group_msg(q.from, q.to, body.msg),
        }
    } else if (event.path === '/im-service/v1/send_group_system_notification') {
        const body = JSON.parse(event.body)
        res = {
            im: await sdk.send_group_system_notification(q.to, null, body.msg),
        }
    } else {
        res = event
    }

    res.query = q
    console.log("Handle im", event.path, ", q=", q, ", res=", res, ", event=", event)
    return res
};
