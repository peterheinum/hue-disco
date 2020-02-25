require('dotenv').config({ path: __dirname + '../../.env' })
const { get, baseHueUrl, setLight, shadeRGBColor } = require('../utils/helpers')
const { calculateXY } = require('../utils/rgbToXY')
const express = require('express')
const router = express.Router()

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
  const [r, g, b] = getRgbFromCssStr(shadeRGBColor(currentColor, 20))
  const xy = calculateXY(r, g, b)
  const previousXy = calculateXY(...getRgbFromCssStr(currentColor))
  setLight({ id, xy })
    .then(() => res.send('ok'))
    .then(() => {
      setTimeout(() => {
        setLight({ id, xy: previousXy })
      }, 300)
    })
})

router.post('/createGroup', (req, res) => {
  const { lightsForSetup } = req.body
  
  res.send(lightsForSetup)
  // createGroup(lightsForSetup)
})

router.post('/editGroup', (req, res) => {
  
})

module.exports = router
