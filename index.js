const express = require('express')
const app = express()
const WsServer = require('express-ws')(app)
const aWss = WsServer.getWss()
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 5000

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL
}))

app.use(express.json())

app.ws('/', (ws, req) => {
  ws.send('You have successfully connected')
  ws.on('message', (msg) => {
    msg = JSON.parse(msg)
    switch(msg.method) {
      case 'connection':
        connectionhandler(ws, msg)
        break
      case 'draw':
        broadcastConnection(ws, msg)
        break
    }
  })
})

app.post('/image', (req, res) => {
  try {
    const data = req.body.img.replace(`data:image/png;base64,`, '')
    fs.writeFileSync(path.resolve(__dirname, 'files', `${req.query.id}.jpg`), data, 'base64')
    return res.json({message: 'image saved'})
  } catch (e) {
    console.log(e)
    return res.json(e)
  }
})

app.get('/image', (req, res) => {
  try {
    const file = fs.readFileSync(path.resolve(__dirname, 'files', `${req.query.id}.jpg`))
    const data = `data:image/png;base64,` + file.toString('base64')
    return res.json(data)
  } catch (e) {
    console.log(e)
    return res.json(e)
  }
})

app.listen(PORT, () => console.log(`server started on ${PORT} port`))

const connectionhandler = (ws, msg) => {
  ws.id = msg.id
  broadcastConnection(ws, msg)
}

const broadcastConnection = (ws, msg) => {
  aWss.clients.forEach(client => {
    if (client.id === msg.id) {
      client.send(JSON.stringify(msg))
    }
  })
}