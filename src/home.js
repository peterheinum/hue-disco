const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  res.send('Nice tunes bruv')
})

module.exports = router