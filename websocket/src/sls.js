'use strict';

const db = require('./db');

on('connect', async (data, socket) => {
  console.log(`connect ${socket.id}`)
  console.log('data', data)
  console.log('env', process.env.wsBackUrl)
    
  // Update info to redis.
  const res = await db.query('INSERT INTO conns(id, wsBackUrl) VALUES(?, ?)', [socket.id, process.env.wsBackUrl])
  console.log('MySQL insert', res)

  return 'connected'
})

on('disconnect', async (data, socket) => {
  console.log(`disconnect ${socket.id}`)
  console.log('data', data)
  console.log('env', process.env.wsBackUrl)
    
  // Update info to redis.
  const res = await db.query('DELETE FROM conns WHERE id=?', socket.id)
  console.log('MySQL delete', res)

  return 'closed'
})

on('message', async (data, socket) => {
  console.log('message', socket, data) // Where data is object.
  console.log('sending to: ', socket.id)
  console.log('env', process.env.wsBackUrl)

  // Call the api-service SCF.
  const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')
  const sdk = new SDK()
  const r0 = await sdk.invoke({
    functionName: process.env.API_SERVICE, 
    logType: LogType.Tail,
    data: {queryString:data || {}} // For Go SCF
  })

  // Modify the response body of api-service SCF.
  let body = JSON.parse(r0.Result.RetMsg)
  console.log('body', body)
  
  await socket.send(
    JSON.stringify(body), // From Go SCF, string
    socket.id
  )
})
  