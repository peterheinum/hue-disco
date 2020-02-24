require('dotenv').config({ path: __dirname + '../../../.env' })
const express = require('express')
const router = express.Router()

const { eventHub } = require('../utils/eventhub')
const { request } = require('../utils/helpers')

router.get('/', async (req, res) => {
  const redirect_uri = encodeURIComponent('http://localhost:3000/callback')
  const scopes = 'user-read-playback-state'
  const url = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&scope=${scopes}&redirect_uri=${redirect_uri}`
  res.redirect(url)
})

router.get('/callback', async (req, res) => {
  const { code } = req.query

  const options = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      'code': code,
      'grant_type': 'authorization_code',
      'redirect_uri': 'http://localhost:3000/callback'
    },
    headers: {
      Authorization: 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    json: true
  }

  const response = await request({ options, method: 'post' })
  const { access_token, refresh_token } = response

  eventHub.emit('auth_recieved', { access_token, refresh_token })
  res.redirect('/react')
})

module.exports = router