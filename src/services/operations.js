require('dotenv').config({ path: __dirname + '../../.env' })
const { get, baseHueUrl } = require('../utils/helpers')
const express = require('express')
const router = express.Router()

const { event_hub } = require('../utils/eventhub')

router.get('/createEvent/*', ({ url }, res) => {
  const [__, ___, event] = url.split('/')
  event_hub.emit(event)
  res.status(200).send()
})

router.get('/getConfig', async (req, res) => {
  const url = `${baseHueUrl()}/lights`
  const setup = await get({ url })
  res.send(setup)
})

module.exports = router
