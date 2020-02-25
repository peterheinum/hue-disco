const fetch = require('node-fetch')
const _request = require('request')

const get = async ({ url, body, method = 'GET', headers }) => await fetch(url, { headers, method, body: JSON.stringify(body) }).then(res => res.json())
const sleep = async time => new Promise(resolve => setTimeout(() => resolve(), time))
const isEqual = (a, b) => JSON.stringify(a) == JSON.stringify(b)
const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY
const emptyArray = (array) => array.splice(0, array.length)
const baseHueUrl = key => `http://${hue_hub()}/api/${key || api_key()}`
const objToArrayWithKeyAsId = obj => Object.keys(obj).map(key => ({ ...obj[key], id: key }))

const request = async ({ options, method }) => {
  !options['headers'] && (options['headers'] = auth_headers())
  return new Promise((res, rej) => {
    _request[method](options, (err, response, body) => {
      err && rej(err)
      body && res(body)
    })
  })
}

const setLight = async ({ id, hue = null, bri, sat = 254, xy = null, transitiontime = 0, on = true }) => {
  hue = Math.floor(hue)
  bri = Math.floor(bri)

  const url = `http://${hue_hub()}/api/${api_key()}/lights/${id}/state`
  const body = { on, sat, hue, xy, bri, transitiontime }
  const method = 'PUT'
  // get({ url, body, method })
  const [status] = await get({ url, body, method })
  return Promise.resolve()
}


const shadeRGBColor = (color, percent) => {
  var f = color.split(','), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = parseInt(f[0].slice(4)), G = parseInt(f[1]), B = parseInt(f[2])
  return 'rgb(' + (Math.round((t - R) * p) + R) + ',' + (Math.round((t - G) * p) + G) + ',' + (Math.round((t - B) * p) + B) + ')'
}

module.exports = {
  get,
  sleep,
  request,
  isEqual, 
  setLight,
  emptyArray, 
  baseHueUrl,
  shadeRGBColor,
  objToArrayWithKeyAsId,
}