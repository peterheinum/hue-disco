require('dotenv').config({ path: __dirname + '../../.env' })
const dtls = require('node-dtls-client').dtls
const axios = require('axios')
const { requireUncached, baseHueUrl, rand, flat } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')
const convertRgbToBytes = require('../utils/convertRgbToBytes')
const state = require('../utils/globalState')
const hueUserName = process.env.HUE_CLIENT_KEY
const hueClientKey = Buffer.from(process.env.HUE_CLIENT_SECRET, 'hex')
const baseGroupUrl = `${baseHueUrl(hueUserName)}/groups`

const stopStream = async id => {
  await axios.put(`${baseGroupUrl}/${id}`, { stream: { active: false } })
  return Promise.resolve()
}


let interval

const startStream = async payload => {
  try {
    clearInterval(interval)
    unsafeStartStream(payload)
  } catch (error) {
    for (let i = 0; i < state.existingGroups.length; i++) {
      const { id } = state.existingGroups[i]
      await stopStream(id)
    }
    startStream(payload)
  }
}

const unsafeStartStream = ({ id, lights }) => {
  axios.put(`${baseGroupUrl}/${id}`, { stream: { active: true } })
    .then(() => {
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
      let socket = dtls.createSocket(options)
      socket
        .on('connected', e => {
          state.currentSync = id
          console.log('connected')
          eventHub.on('emitLight', lightAndColorArray => {
            const message = Buffer.concat([
              Buffer.from("HueStream", "ascii"),
              Buffer.from([
                0x01, 0x00,

                0x07,

                0x00, 0x00,

                0x00,

                0x00,

                ...flat(lightAndColorArray)
              ])
            ])
            socket && socket.send(message)
          })
        })
        .on('error', e => {
          console.log('ERROR', e)
        })
        .on('message', msg => {
          console.log('MESSAGE', msg)
        })
        .on('close', e => {
          socket = null
          eventHub.on('emitLight', () => console.log('nah bruv socket is not connect'))
          console.log('CLOSE', e)
        })
    })
}

module.exports = { stopStream, startStream }