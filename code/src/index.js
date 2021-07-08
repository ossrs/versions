'use strict';

const CaptchaClient = require("tencentcloud-sdk-nodejs").captcha.v20190722.Client

exports.main_handler = async (event, context) => {
    console.log('code verify', event)

    const r = (event && event.body)? JSON.parse(event.body) : {}
    const clientIp = (event && event.requestContext) ? event.requestContext.sourceIp : "127.0.0.1";
    console.log(`verify client=${clientIp}, ak=${process.env.TENCENT_SECRET_ID}, r=`, r)

    const params = {
        CaptchaType: 9,
        Ticket: r.ticket,
        UserIp: clientIp,
        Randstr: r.randstr,
        CaptchaAppId: parseInt(process.env.CAPTCHA_APP_ID),
        AppSecretKey: process.env.CAPTCHA_APP_SECRET_KEY,
    }
    const res = await new Promise((resolve, reject) => {
        const sdk = new CaptchaClient({
            credential: {
                secretId: process.env.TENCENT_SECRET_ID,
                secretKey: process.env.TENCENT_SECRET_KEY,
            },
            profile: {
                httpProfile: {
                    // @see https://cloud.tencent.com/document/product/1110/36926
                    endpoint: "captcha.tencentcloudapi.com",
                },
            },
        })

        sdk.DescribeCaptchaResult(params).then(
            (data) => {
                resolve(data)
            },
            (err) => {
                reject(err)
            }
        )
    })

    console.log('verify response', res)
    return res
};

