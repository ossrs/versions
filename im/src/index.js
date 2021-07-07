'use strict';

const im = require('./im.server')
const TLSSigAPIv2 = require('tls-sig-api-v2')
const sha256 = require('js-sha256').sha256
const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')
const SDKAppID = parseInt(process.env.IM_SDKAPPID)
const tim = im.create(SDKAppID, process.env.IM_SECRETKEY, process.env.IM_ADMINISTRATOR)

exports.main_handler = async (event, context) => {
    const q = event.queryString || {}
    if (event.path === '/im-service/v1/callback') {
        const body = event.body? JSON.parse(event.body) : {}
        body.Info = body.Info || {}

        // 状态变更回调，@see https://cloud.tencent.com/document/product/269/2570
        if (body && body.CallbackCommand === 'State.StateChange') {
            await new SDK().invoke({functionName: process.env.DB_SERVICE, logType: LogType.Tail, data: {
                path: '/db/v1/logtrace', queryString: {level: 'trace', module: 'im', event: body.Info.Action, msg: `${body.Info.To_Account} ${body.Info.Action} for ${body.Info.Reason}, im-callback ${event.body}`},
            }})
        }

        const res = {ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: ''}
        console.log(`Handle im ${event.path}, body=${event.body}, q=${JSON.stringify(q)}, res=${JSON.stringify(res)}`)
        return res
    }

    let res = null
    if (event.path === '/im-service/v1/login') {
        // Call the db-service SCF to verify admin user in MySQL.
        const r0 = await new SDK().invoke({functionName: process.env.DB_SERVICE, logType: LogType.Tail, data: {
            path: '/db/v1/admins', queryString: {user: q.user, password: q.password},
        }})
      
        const r1 = r0.Result && r0.Result.RetMsg && JSON.parse(r0.Result.RetMsg)
        console.log('verify user ${q.user}, r1=', r1, ', r0=', r0)
        if (!r1 || !r1.verify) {
            throw new Error('verify user ' + q.user + ' failed')
        }

        res = {
            SDKAppID: SDKAppID,
            userID: q.user,
            userSig: new TLSSigAPIv2.Api(SDKAppID, process.env.IM_SECRETKEY).genSig(q.user, 1 * 24 * 3600),
            im: await tim.account_import(q.user, q.nickName, q.faceUrl), 
        }
    } else if (event.path === '/im-service/v1/account_import') {
        res = {im: await tim.account_import(q.user, q.nickName, q.faceUrl)}
    } else if (event.path === '/im-service/v1/enter_room') {
        await tim.create_group(q.user, tim.TYPES.GRP_WORK, q.id, q.id),
        res = {im: await tim.add_group_member(q.id, 1, [q.user])}
    } else if (event.path === '/im-service/v1/delete_room') {
        res = {im: await tim.destroy_group(q.id)}
    } else if (event.path === '/im-service/v1/leave_room') {
        res = {im: await tim.delete_group_member(q.id, 1, [q.user])}
    } else if (event.path === '/im-service/v1/change_owner') {
        res = {im: await tim.change_group_owner(q.id, q.user)}
    } else if (event.path === '/im-service/v1/sendmsg') {
        const body = JSON.parse(event.body)
        res = {im: await tim.sendmsg(q.from, 2, q.to, body.msg)}
    } else if (event.path === '/im-service/v1/send_group_msg') {
        const body = JSON.parse(event.body)
        res = {im: await tim.send_group_msg(q.from, q.to, body.msg)}
    } else if (event.path === '/im-service/v1/send_group_system_notification') {
        const body = JSON.parse(event.body)
        res = {im: await tim.send_group_system_notification(q.to, null, body.msg)}
    } else {
        res = event
    }

    console.log("Handle im", event.path, ", q=", q, ", res=", res, ", event=", event)
    return res
};
