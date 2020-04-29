require('dotenv').config({ path: __dirname + '../../.env' })
require('./services/spotifySync')
const express = require('express')()
const http = require('http').createServer(express)
const bodyParser = require('body-parser')
const compression = require('compression')

//Express config
express.use(compression())
express.use(bodyParser.json())
express.use(bodyParser.urlencoded({ extended: true }))
express.use('/', require('./services/reactRenderer'))
express.use('/api/', require('./services/api'))
express.use('/auth', require('./auth/spotifyAuth'))
express.use(require('express').static('public'))

const { eventHub } = require('./utils/eventHub')
const { getInts } = require('./utils/helpers')

/* Websocket for keyboard */
const io = require('socket.io')(http)
const emitToLights = message => {
  const { ints, chars } = getInts(message)
  ints.length && eventHub.emit('activeLights', ints)
  chars.length && eventHub.emit('keyboard', chars)
}

io.on('connect', socket => {
  socket.on('disconnect', () => console.log('websocket disconnected'))
  socket.on('message', emitToLights)
})

http.listen(3000, () => console.log('Webhook server is listening, port 3000'))

