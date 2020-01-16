const fetch = require('node-fetch')
const get = async ({ url, body, method, headers }) => await fetch(url, { headers, method, body: JSON.stringify(body) }).then(res => res.json())

const _request = require('request')
const request = async ({ options, method }) => {
  !options['headers'] && (options['headers'] = auth_headers())
  return new Promise((res, rej) => {
    _request[method](options, (err, response, body) => {
      err && rej(err)
      body && res(body)
    })
  })
}

const sleep = async time => new Promise(resolve => setTimeout(() => resolve(), time))

const is_equal = (a, b) => JSON.stringify(a) == JSON.stringify(b)

const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY

const set_light = async ({ id, hue, bri, sat = 254 }) => {
  hue = Math.floor(hue)
  bri = Math.floor(bri)

  const url = `http://${hue_hub()}/api/${api_key()}/lights/${id}/state`
  const body = { on: true, sat, hue, bri }
  const method = 'PUT'
  const [status] = await get({ url, body, method })
  return Promise.resolve()
}

const clear_array = (array) => array.splice(0, array.length)


module.exports = {
  get,
  request,
  sleep,
  is_equal, 
  set_light,
  clear_array
}