'use strict';

const NodeMailer = require('nodemailer')

exports.main_handler = async (event, context) => {
    const res = await new Promise((resolve, reject) => {
        const conn = NodeMailer.createTransport({
            host: process.env.EMAIL_SERVICE,
            port: parseInt(process.env.EMAIL_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            }
        })

        const data = {
            from: `Verify<${process.env.EMAIL_USER}>`,
            to: ['winterserver'].map((e) => e + '@126.com'),
            subject: 'Hello',
            text: 'Hello, SRS!',
        }
        conn.sendMail(data, (err, info) => {
            if (err) {
                reject(err)
            } else {
                resolve(info)
            }
        })
    })

    console.log('email', res, 'by', event)
    return res
}

