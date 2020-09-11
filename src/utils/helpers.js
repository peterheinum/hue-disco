const { prop, filter } = require('ramda')
const axios = require('axios')
const fetch = require('node-fetch')
const _request = require('request')

const hueUserName = process.env.HUE_CLIENT_KEY

const get = async ({ url, body, method = 'GET', headers }) => await fetch(url, { headers, method, body: JSON.stringify(body) }).then(res => res.json())
const avg = arr => arr.reduce((acc, cur) => acc += cur, 0) / arr.length
const int = str => parseInt(str)
const sleep = async time => new Promise(resolve => setTimeout(() => resolve(), time))
const flat = arr => arr.reduce((acc, cur) => [...acc, ...cur],[])
const rand = max => Math.floor(Math.random() * max)
const isEqual = (a, b) => JSON.stringify(a) == JSON.stringify(b)
const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY
const emptyArray = (array) => array.splice(0, array.length)
const baseHueUrl = key => `http://${hue_hub() || '192.168.1.8'}/api/${key || api_key()}`
const baseGroupUrl = `${baseHueUrl(hueUserName)}/groups`
const getRgbFromCssStr = str => str.split('rgb(')[1].split(')')[0].split(',')
const objToArrayWithKeyAsId = obj => Object.keys(obj).map(key => ({ ...obj[key], id: key }))

const round = number => Math.round(number)
const doubleRGB = (r, g, b) => [round(r), round(r), round(g), round(g), round(b), round(b)]

const unique = arr => [...new Set(arr)]

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
  get({ url, body, method })
  // const [status] = await get({ url, body, method })
  return Promise.resolve()
}

const getEntertainmentGroups = () => {
  const condition = ({ type }) => type == 'Entertainment'

  return new Promise((resolve, reject) => {
    axios
      .get(baseGroupUrl)
      .then(prop('data'))
      .then(objToArrayWithKeyAsId)
      .then(filter(condition))
      .then(resolve)
      .catch(reject)
  })
}

const requireUncached = _module => {
  delete require.cache[require.resolve(_module)]
  return require(_module)
}

const shadeRGBColor = (color, percent) => {
  var f = color.split(','), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = parseInt(f[0].slice(4)), G = parseInt(f[1]), B = parseInt(f[2])
  return 'rgb(' + (Math.round((t - R) * p) + R) + ',' + (Math.round((t - G) * p) + G) + ',' + (Math.round((t - B) * p) + B) + ')'
}

const randomFromArray = array => array[rand(array.length)]

const callStack = ([fn, ...rest]) => fn().then(() => rest.length && callStack(rest))

const wait = () => sleep(500)

const findHandler = (key, dictionary) => dictionary.find(obj => obj[0] == key) || [null, null]

module.exports = {
  int,
  avg,
  get,
  flat,
  wait,
  rand,
  round,
  sleep,
  unique,
  request,
  isEqual, 
  setLight,
  doubleRGB,
  callStack,
  emptyArray,
  baseHueUrl,
  findHandler, 
  baseGroupUrl,
  shadeRGBColor,
  randomFromArray,
  requireUncached,
  getRgbFromCssStr,
  objToArrayWithKeyAsId,
  getEntertainmentGroups,
}