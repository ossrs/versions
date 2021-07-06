
on('connect', async (data, socket) => {
  console.log(`connect ${socket.id}`)
  console.log('data', data)
  console.log('env', process.env.wsBackUrl)

  return 'connected'
})

on('disconnect', async (data, socket) => {
  console.log(`disconnect ${socket.id}`)
  console.log('data', data)
  console.log('env', process.env.wsBackUrl)

  return 'closed'
})

on('message', async (data, socket) => {
  console.log('message', socket, data)
  console.log('sending to: ', socket.id)
  console.log('env', process.env.wsBackUrl)

  // Call the api-service SCF.
  const { SDK, LogType }  = require('tencentcloud-serverless-nodejs')
  const scf = new SDK()
  const res = await scf.invoke({
    functionName: process.env.API_SERVICE, 
    logType: LogType.Tail,
    data: {queryString:data || {}} // For Go SCF
  })

  // Modify the response body of api-service SCF.
  let body = JSON.parse(res.Result.RetMsg)
  console.log('body', body)
  
  await socket.send(
    JSON.stringify(body), // From Go SCF, string
    socket.id
  )
})
  