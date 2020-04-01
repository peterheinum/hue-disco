require('dotenv').config({ path: __dirname + '../../.env' })

const axios = require('axios')
const { getEntertainmentGroups, baseGroupUrl, flat, doubleRGB } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')
const state = require('../utils/globalState')

const hueUserName = process.env.HUE_CLIENT_KEY
const hueClientKey = Buffer.from(process.env.HUE_CLIENT_SECRET, 'hex')

const stopStream = id => new Promise((resolve, reject) =>
  axios
    .put(`${baseGroupUrl}/${id}`, { stream: { active: false } })
    .then(resolve)
    .catch(reject)
)

const stopEachStream = groups => new Promise((resolve, reject) =>
  Promise.all(groups.map(({ id }) => stopStream(id)))
    .then(resolve)
    .catch(reject)
)

const getGroupsAndStopStreams = () => new Promise((resolve, reject) =>
  getEntertainmentGroups()
    .then(stopEachStream)
    .then(resolve)
    .catch(reject)
)

const restart = () => getGroupsAndStopStreams().then(() => startStream())

let i = 0
const startStream = () => {
  i++
  console.log('unsafeStartStream has been called ', i)
  console.log('connecting to: ', state.currentGroup.id)
  axios.put(`${baseGroupUrl}/${state.currentGroup.id}`, { stream: { active: true } })
    .then(connectToSocket)
    .catch(restart)
}

const getSocket = () => {
  const options = {
    type: 'udp4',
    address: process.env.HUE_HUB,
    port: 2100,
    psk: {
      [hueUserName]: hueClientKey
    },
    timeout: 1000
  }

  options.psk[hueUserName] = hueClientKey
  delete require.cache[require.resolve('node-dtls-client')]
  const dtls = require('node-dtls-client').dtls

  return dtls.createSocket(options)
}

const formatSocketMessage = lights => {
  return Buffer.concat([
    Buffer.from("HueStream", "ascii"),
    Buffer.from([
      0x01, 0x00,

      0x07,

      0x00, 0x00,

      0x00,

      0x00,

      ...flat(lights)
    ])
  ])
}

const sendInitMessage = socket => {
  const lights = state.currentGroup.lights.map(id => [0x00, 0x00, parseInt(id), ...doubleRGB(255, 0, 0)])
  socket.send(formatSocketMessage(lights))
}

const connectToSocket = () => {
  const socket = getSocket()
  console.log('connectToSocket')
  socket
    .on('connected', e => {
      state.currentSync = state.currentGroup.id
      console.log('connected')
      sendInitMessage(socket)     
      eventHub.on('emitLight', lights => {
        const message = formatSocketMessage(lights)

        socket && socket.send(message)
      })
    })
    .on('error', e => {
      console.log('ERROR', e)
      setTimeout(() => {
        restart()
      }, 30000)
    })
    .on('close', e => {
      eventHub.on('emitLight', () => console.log('nah bruv socket is not connect'))
      console.log('CLOSE', e)
    })
}

module.exports = { stopStream, startStream, getGroupsAndStopStreams }