'use strict';

const im = require('./im.server')

exports.main_handler = async (event, context) => {
    console.log("Hello World", event, context, process.env)

    if (event.path === '/im-service/v1/login') {
        const user = event.queryString.user
        const {userSig} = await im.login(process.env.IM_SDKAPPID, user, process.env.IM_SECRETKEY)
        return {
            user_id: user,
            user_sig: userSig,
        }
    }

    return event
};
