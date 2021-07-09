'use strict';

const SmsClient = require("tencentcloud-sdk-nodejs").sms.v20210111.Client

exports.main_handler = async (event, context) => {
    console.log('sms', event)

    const params = {
        SmsSdkAppId: process.env.SMS_SDKAPPID,
        SignName: process.env.SMS_SIGN_NAME,
        TemplateId: process.env.SMS_TEMPLATE_ID,
        TemplateParamSet: [Math.random().toString().slice(-6)],
        PhoneNumberSet: [process.env.SMS_PHONE_NUMBER],
    }
    const res = await new Promise((resolve, reject) => {
        const sdk = new SmsClient({
            credential: {
                secretId: process.env.TENCENT_SECRET_ID,
                secretKey: process.env.TENCENT_SECRET_KEY,
            },
            region: process.env.REGION,
            profile: {
                httpProfile: {
                    // @see https://cloud.tencent.com/document/product/382/43197
                    endpoint: "sms.tencentcloudapi.com",
                },
            },
        })

        sdk.SendSms(params).then(
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

