'use strict';

const im = require('./im.server')
const TLSSigAPIv2 = require('tls-sig-api-v2')
const sha256 = require('js-sha256').sha256
const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')
const SDKAppID = parseInt(process.env.IM_SDKAPPID)
const tim = im.create(SDKAppID, process.env.IM_SECRETKEY, process.env.IM_ADMINISTRATOR)

exports.main_handler = async (event, context) => {
    const q = event.queryString || {}
    const body = event.body? JSON.parse(event.body) : {}

    let res = null
    if (event.path === '/im-service/v1/account_import') {
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
        res = {im: await tim.sendmsg(q.from, 2, q.to, body.msg)}
    } else if (event.path === '/im-service/v1/send_group_msg') {
        res = {im: await tim.send_group_msg(q.from, q.to, body.msg)}
    } else if (event.path === '/im-service/v1/send_group_system_notification') {
        res = {im: await tim.send_group_system_notification(q.to, null, body.msg)}
    } else {
        res = event
    }

    console.log("Handle im-internal", event.path, ", q=", q, ", res=", res, ", event=", event)
    return res
};
