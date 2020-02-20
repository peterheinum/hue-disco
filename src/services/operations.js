require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')
const router = express.Router()

const { event_hub } = require('../utils/eventhub')

router.get('*', ({ url }, res) => {
  const [__, ___, event] = url.split('/')
  event_hub.emit(event)
  res.status(200).send()
})

module.exports = router
