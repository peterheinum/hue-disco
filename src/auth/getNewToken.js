const fs = require('fs')
const path = require('path')
const { request } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')

const readCurrentTokens = () => {
  const filePath = path.resolve(`${__dirname}/../utils/spotifyAuth`)
  const json = fs.readFileSync(filePath)
  if (!json.toString()) return
  return JSON.parse(json)
}

const getNewToken = async () => {
  const { auth } = readCurrentTokens()
  const { refresh_token } = auth

  const options = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      'refresh_token': refresh_token,
      'grant_type': 'refresh_token',
      'redirect_uri': 'http://localhost:3000/auth/callback'
    },
    headers: {
      Authorization: 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    json: true
  }

  const response = await request({ options, method: 'post' })
  console.log(response)
  eventHub.emit('authRecieved', response)
}

module.exports = getNewToken