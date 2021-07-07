'use strict';

const TLSSigAPIv2 = require('tls-sig-api-v2')
const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')
const SDKAppID = parseInt(process.env.IM_SDKAPPID)

exports.main_handler = async (event, context) => {
    const q = event.queryString || {}
    if (event.path === '/im-service/v1/callback') {
        const body = event.body? JSON.parse(event.body) : {}
        body.Info = body.Info || {}

        // 状态变更回调，@see https://cloud.tencent.com/document/product/269/2570
        if (body && body.CallbackCommand === 'State.StateChange') {
            await new SDK().invoke({functionName: process.env.DB_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/db-internal/v1/logtrace', queryString: {level: 'trace', module: 'im', event: body.Info.Action, msg: `${body.Info.To_Account} ${body.Info.Action} for ${body.Info.Reason}, im-callback ${event.body}`},
            }})
        }

        const res = {ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: ''}
        console.log(`Handle im ${event.path}, body=${event.body}, q=${JSON.stringify(q)}, res=${JSON.stringify(res)}`)
        return res
    }

    let res = {}
    if (event.path === '/im-service/v1/login') {
        // Call the db SCF to verify admin user in MySQL.
        const r0 = parseSFCResult(await new SDK().invoke({functionName: process.env.DB_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/db-internal/v1/admins', queryString: {user: q.user, password: q.password},
        }}))
        console.log('verify user ${q.user}, r0=', r0)
        if (!r0 || !r0.verify) {
            throw new Error(`verify user ${q.user} failed`)
        }

        res = {
            SDKAppID: SDKAppID,
            userID: q.user,
            userSig: new TLSSigAPIv2.Api(SDKAppID, process.env.IM_SECRETKEY).genSig(q.user, 1 * 24 * 3600),
            token: r0.token,
        }
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/account_import', queryString: q,
        }}))
    } else if (event.path === '/im-service/v1/enter_room') {
        await verifyUserToken(q.user, q.token)
        await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/create_group', queryString: q,
        }})
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/add_group_member', queryString: q,
        }}))
    } else if (event.path === '/im-service/v1/delete_room') {
        await verifyUserToken(q.user, q.token)
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/destroy_group', queryString: q,
        }}))
    } else if (event.path === '/im-service/v1/leave_room') {
        await verifyUserToken(q.user, q.token)
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/delete_group_member', queryString: q,
        }}))
    } else if (event.path === '/im-service/v1/change_owner') {
        await verifyUserToken(q.user, q.token)
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/change_group_owner', queryString: q,
        }}))
    } else if (event.path === '/im-service/v1/sendmsg') {
        await verifyUserToken(q.user, q.token)
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/sendmsg', queryString: q, body: event.body,
        }}))
    } else if (event.path === '/im-service/v1/send_group_msg') {
        await verifyUserToken(q.user, q.token)
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/send_group_msg', queryString: q, body: event.body,
        }}))
    } else if (event.path === '/im-service/v1/send_group_system_notification') {
        await verifyUserToken(q.user, q.token)
        res.im = parseSFCResult(await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/im-internal/v1/send_group_system_notification', queryString: q, body: event.body,
        }}))
    } else {
        res = event
    }

    console.log("Handle im", event.path, ", q=", q, ", res=", res, ", event=", event)
    return res
};

function parseSFCResult(res) {
    return (!res || !res.Result || !res.Result.RetMsg)? null : JSON.parse(res.Result.RetMsg)
}

async function verifyUserToken(user, token) {
    const r0 = await new SDK().invoke({
        functionName: process.env.DB_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/db-internal/v1/token', queryString: {user: user, token: token},
        },
    })

    const r1 = (!r0 || !r0.Result || !r0.Result.RetMsg)? null : JSON.parse(r0.Result.RetMsg)
    console.log('verify token ${user}, ${token} r0=', r1)

    if (!r1 || !r1.verify) {
        throw new Error(`verify token ${token} for user ${user} failed`)
    }

    return null
}

