require('dotenv').config({ path: __dirname + '../../.env' })
const dtls = require('node-dtls-client').dtls
const axios = require('axios')
const { baseHueUrl, rand, flat } = require('../utils/helpers')
const convertRgbToBytes = require('../utils/convertRgbToBytes')
const store = require('../utils/store')
const hueUserName = process.env.HUE_CLIENT_KEY
const hueClientKey = Buffer.from(process.env.HUE_CLIENT_SECRET, 'hex')
const baseGroupUrl = `${baseHueUrl(hueUserName)}/groups`

const stopStream = async id => {
  await axios.put(`${baseGroupUrl}/${id}`, { stream: { active: false } })
  return Promise.resolve()
}

const randomRgb = () => rand(255)
let interval

const startStream = async payload => {
  try {
    clearInterval(interval)
    unsafeStartStream(payload)
  } catch (error) {
    for (let i = 0; i < store.existingGroups.length; i++) {
      const { id } = store.existingGroups[i]
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
      const socket = dtls.createSocket(options)
      socket
        .on('connected', e => {
          store.currentSync = id
          console.log('connected')
          interval = setInterval(() => {
            const r1 = randomRgb()
            const g1 = randomRgb()
            const b1 = randomRgb()
            const r2 = randomRgb()
            const g2 = randomRgb()
            const b2 = randomRgb()
            const [x, y] = convertRgbToBytes(r1, g1, b1)
            const [x2, y2] = convertRgbToBytes(r2, g2, b2)
            const values = {
              '0': [x, y],
              '1': [x2, y2]
            }

            const test = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...values[index][0], ...values[index][1], 0x00, 0xff])
            console.log(test)

            const message = Buffer.concat([
              Buffer.from("HueStream", "ascii"),
              Buffer.from([
                0x01, 0x00,

                0x07,

                0x00, 0x00,

                0x00,

                0x00,

                ...flat(test)
              ])
            ])
            socket.send(message)
          }, 500)
        })
        .on('error', e => {
          console.log('ERROR', e)
        })
        .on('message', msg => {
          console.log('MESSAGE', msg)
        })
        .on('close', e => {
          clearInterval(interval)
          console.log('CLOSE', e)
        })
    })
}

module.exports = { stopStream, startStream }