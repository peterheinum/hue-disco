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
  const [r, g, b] = getRgbFromCssStr(shadeRGBColor(currentColor, 20))
  const xy = calculateXY(r, g, b)
  const previousXy = calculateXY(...getRgbFromCssStr(currentColor))
  setLight({ id, xy })
    .then(() => res.send('ok'))
    .then(async () => {
      await sleep(300)
      setLight({ id, xy: previousXy })
    })
})

router.get('/getGroups', (req, res) => {
  getGroups()
    .then(resp => res.send(resp))
    .catch(err => res.status(500).send(err))
})

router.post('/createGroup', (req, res) => {
  const { lightsForSetup } = req.body

  res.send(lightsForSetup)
  // createGroup(lightsForSetup)
})

router.post('/editGroup', (req, res) => {

})


module.exports = router
