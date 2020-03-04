require('dotenv').config({ path: __dirname + '../../.env' })
const { get, baseHueUrl, setLight, shadeRGBColor, sleep } = require('../utils/helpers')
const { calculateXY } = require('../utils/rgbToXY')
const express = require('express')
const router = express.Router()
const { createGroup, getGroups, editGroup } = require('../utils/groupHandler')
const { eventHub } = require('../utils/eventhub')

router.get('/createEvent/*', ({ url }, res) => {
  const [__, ___, event] = url.split('/')
  eventHub.emit(event)
  res.status(200).send()
})

router.get('/getConfig', async (req, res) => {
  const url = `${baseHueUrl()}/lights`
  const setup = await get({ url })
  res.send(setup)
})

const getRgbFromCssStr = str => str.split('rgb(')[1].split(')')[0].split(',')

router.post('/flashLight/', async (req, res) => {
  const { light } = req.body
  const { currentColor, id } = light
  if(currentColor) {
    const [r, g, b] = getRgbFromCssStr(shadeRGBColor(currentColor, 20))
    const xy = calculateXY(r, g, b)
    const previousXy = calculateXY(...getRgbFromCssStr(currentColor))
    
    await setLight({ id, xy })
    res.send('ok')
    await sleep(500)
    await setLight({ id, xy: previousXy })
  }

  if(!currentColor) {
    await setLight({ id, on: false })
    await sleep(500)
    await setLight({ id, on: true })
    res.send('ok')
  }
})

router.get('/getGroups', (req, res) => {
  getGroups()
    .then(resp => res.send(resp))
    .catch(err => res.status(500).send(err))
})

router.post('/createGroup', (req, res) => {
  const { lightsForSetup } = req.body

  createGroup(lightsForSetup)
  res.send(lightsForSetup)
})

router.post('/editGroup', async (req, res) => {
  const { group } = req.body
  const { id, lights } = group
  const response = await editGroup(id, lights)
  res.send(response)
})

router.get('/initSpotifySync', (req, res) => {
  res.redirect('/auth')
})


module.exports = router
