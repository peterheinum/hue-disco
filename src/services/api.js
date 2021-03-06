require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')
const router = express.Router()
const state = require('../stores/globalState')

const { eventHub } = require('../utils/eventHub')
const { calculateXY } = require('../utils/rgbToXY')
const { startStream, stopStream } = require('./socket')
const { createGroup, getGroups, editGroup } = require('./groupHandler')
const { get, baseHueUrl, setLight, shadeRGBColor, sleep, getRgbFromCssStr } = require('../utils/helpers')
const {setState, getState} = require('../stores/globalState')

router.get('/getConfig', async (req, res) => {
  const url = `${baseHueUrl()}/lights`
  const setup = await get({ url })
  res.send(setup)
})

router.get('/getGroups', (req, res) => {
  getGroups()
    .then(resp => res.send(resp))
    .catch(err => res.status(500).send(err))
})

router.post('/createGroup', (req, res) => {
  const { lightsForSetup } = req.body

  //#TODO LATER
  // createGroup(lightsForSetup)
  res.send(lightsForSetup)
})

router.post('/sync/start', async (req, res) => {
  const { syncId, existingGroups } = req.body
  setState('existingGroups', existingGroups)
  const streamsToStop = existingGroups.filter(x => x.id != syncId).map(x => x.id)
  for (let i = 0; i < streamsToStop.length; i++) {
    await stopStream(streamsToStop[i])
  }
  
  const groupToSync = existingGroups.find(x => x.id == syncId)
  
  setState('currentGroup', groupToSync)
  startStream(groupToSync)
  eventHub.emit('startPingInterval')
  res.send()
})

router.get('/sync/current/:id', async (req, res) => {
  res.send(getState('currentGroup').id)
})



router.post('/editGroup', async (req, res) => {
  const { group } = req.body
  const { id, lights } = group
  editGroup(id, lights)
    .then(res.send)
})

router.post('/flashLight/', async (req, res) => {
  const { light } = req.body
  const { currentColor, id } = light
  if (currentColor) {
    const [r, g, b] = getRgbFromCssStr(shadeRGBColor(currentColor, 20))
    const xy = calculateXY(r, g, b)
    const previousXy = calculateXY(...getRgbFromCssStr(currentColor))

    await setLight({ id, xy })
    res.send('ok')
    await sleep(500)
    await setLight({ id, xy: previousXy })
  }

  if (!currentColor) {
    await setLight({ id, on: false })
    await sleep(500)
    await setLight({ id, on: true })
    res.send('ok')
  }
})



router.post('/setColors', (req, res) => {
  const { colors } = req.body
  eventHub.emit('setColors', colors)
  res.send({ ...state })
})


module.exports = router