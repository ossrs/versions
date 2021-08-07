'use strict';

const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')

const im = require('./im.server')
const SDKAppID = parseInt(process.env.IM_SDKAPPID)
const tim = im.create(SDKAppID, process.env.IM_SECRETKEY, process.env.IM_ADMINISTRATOR)

exports.main_handler = async (event, context) => {
    const q = event.queryString || {}
    const body = event.body? JSON.parse(event.body) : {}

    // Initialize system.
    await initialize()

    let res = null
    // RAW IM APIs.
    if (event.path === '/im-internal/v1/account_import') {
        res = await tim.account_import(q.user, q.nickName, q.faceUrl)
    } else if (event.path === '/im-internal/v1/create_group') {
        res = await tim.create_group(q.user, q.type, q.id, q.id)
    } else if (event.path === '/im-internal/v1/add_group_member') {
        res = await tim.add_group_member(q.id, 1, [q.user])
    } else if (event.path === '/im-internal/v1/destroy_group') {
        res = await tim.destroy_group(q.id)
    } else if (event.path === '/im-internal/v1/delete_group_member') {
        res = await tim.delete_group_member(q.id, 1, [q.user])
    } else if (event.path === '/im-internal/v1/change_group_owner') {
        res = await tim.change_group_owner(q.id, q.to)
    } else if (event.path === '/im-internal/v1/sendmsg') {
        res = await tim.sendmsg(q.from, 2, q.to, body.msg)
    } else if (event.path === '/im-internal/v1/send_group_msg') {
        res = await tim.send_group_msg(q.from, q.to, body.msg)
    } else if (event.path === '/im-internal/v1/send_group_system_notification') {
        res = await tim.send_group_system_notification(q.to, null, body.msg)
    // Room internal APIs.
    } else if (event.path === '/im-internal/v1/enter_room') {
        await tim.create_group(q.user, q.type, q.id, q.id)
        res = await tim.add_group_member(q.id, 1, [q.user])
    // Unknown API.
    } else {
        res = event
    }

    console.log("Handle im-internal", event.path, ", q=", q, ", res=", res, ", event=", event)
    return res
};

// Import admins to IM.
global.initialized

async function initialize() {
    if (global.initialized) {
        return
    }
    global.initialized = true

    // Call the db SCF to get system users.
    let r0 = await new SDK().invoke({functionName: process.env.DB_INTERNAL_SERVICE, logType: LogType.Tail, data: {
            path: '/db-internal/v1/users',
        }})
    let r1 = r0.Result && r0.Result.RetMsg && JSON.parse(r0.Result.RetMsg)
    console.log('users', r1.users)

    // Call the im SCF to register users to IM, then create group and join.
    r1.users.map(async function(user) {
        await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
                path: '/im-internal/v1/account_import', queryString: {user: user}
            }})
        await new SDK().invoke({functionName: process.env.IM_INTERNAL_SERVICE, logType: LogType.Tail, data: {
                path: '/im-internal/v1/enter_room', queryString: {user: user, id: process.env.IM_GROUP_SYSLOG, type: process.env.IM_GROUP_TYPE}
            }})
    })
}

