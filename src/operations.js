require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')
const router = express.Router()

const { event_hub } = require('./eventhub')


router.get('/tempoIncrement', async (req, res) => {
  event_hub.emit('tempoIncrement')
  res.status(200).send()
})


router.get('/tempoDecrement', async (req, res) => {
  event_hub.emit('tempoDecrement')
  res.status(200).send()
})



module.exports = router
