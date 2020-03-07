require('dotenv').config({ path: __dirname + '../../.env' })
const dtls = require('node-dtls-client').dtls
const axios = require('axios')
const { baseHueUrl } = require('../utils/helpers')
const { convertRgbToBytes } = require('../utils/rgbToXY')
const hueUserName = process.env.HUE_CLIENT_KEY || 'pfmrEdAJUmKiO0d4mA4rJeWjLuKzssZtN6gsV2UZ'
const hueClientKey = Buffer.from(process.env.HUE_CLIENT_SECRET || '28A0140D985A3B8B5AEE3D0CB3B18919', 'hex')
const baseGroupUrl = `${baseHueUrl(hueUserName)}/groups`

const stopStream = async id => {
  await axios.put(`${baseGroupUrl}/${id}`, { stream: { active: false } })
  return Promise.resolve()
}

const rand = max => Math.floor(Math.random() * max)
// const randomRgb = `rgb(${rand(255)}, ${rand(255)}, ${rand(255)})`
const randomRgb = () => rand(255)

const startStream = ({ id, lights }) => {
  axios.put(`${baseGroupUrl}/${id}`, { stream: { active: true } })
    .then(() => {
      const options = {
        type: 'udp4',
        address: process.env.HUE_HUB || '192.168.1.8',
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
          console.log('connected')
          setInterval(() => {
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

            const test = lights.map(({ id }, index) => [0x00, 0x00, 0x0 + id, ...values[index][0], ...values[index][1], 0x00, 0xff])
            console.log(test)

            const message = Buffer.concat([
              Buffer.from("HueStream", "ascii"),
              Buffer.from([
                0x01, 0x00,

                0x07,

                0x00, 0x00,

                0x00,

                0x00,

                0x00, 0x00, 0x03, //light id
                // 0x99, 1, 0x00, 0x00, 0x00, 0x00,  //config for light 
                ...x, ...y, 0x00, 0xff,

                0x00, 0x00, 0x06,
                // 0x00, 0x00, 0x00, 0x00, 0xff, 0xff
                ...x2, ...y2, 0x00, 0xff
              ])
            ])
            
            // socket.send(message)
          }, 30)
        })
        .on('error', e => {
          console.log('ERROR', e)
        })
        .on('message', msg => {
          console.log('MESSAGE', msg)
        })
        .on('close', e => {
          console.log('CLOSE', e)
        })
    })
}

module.exports = { stopStream, startStream }