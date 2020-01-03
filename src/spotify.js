require('dotenv').config({ path: __dirname + '../../.env' })
const fs = require('fs')
const express = require('express')()
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const _request = require('request')
// const { get } = require('./utils')

const get = async ({ url, body, method, headers }) => await fetch(url, { headers, method, body: JSON.stringify(body) })
express.use(bodyParser.json())
express.use(bodyParser.urlencoded({ extended: true }))
express.listen(3000, () => console.log('Webhook server is listening, port 3000'))


const state = {
  access_token: '',
  refresh_token: ''
}

const auth_headers = () => ({
  'Authorization': 'Bearer ' + state.access_token,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
})


const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const redirect_uri = encodeURIComponent('http://localhost:3000/callback')

const readFile = async path => new Promise((res, rej) => fs.readFile(path, 'utf8', (err, data) => err ? rej(err) : res(data)))

// currentlyPlaying: 'https://api.spotify.com/v1/me/player',
// trackAnalysis: 'https://api.spotify.com/v1/audio-analysis/',
// trackFeatures: 'https://api.spotify.com/v1/audio-features/',


express.get('/', async (req, res) => {
  const scopes = 'user-read-playback-state'
  // const query = querystring.stringify({
  //   client_id,
  //   response_type: 'code',
  //   scope: 'user-read-playback-state',
  //   redirect_uri,
  // })

  // const url = 'https://accounts.spotify.com/authorize?' + query
  const url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&scope=${scopes}&redirect_uri=${redirect_uri}`
  res.redirect(url)
})






const request = async ({ options, method }) => {
  return new Promise((res, rej) => {
    _request[method](options, (err, response, body) => {
      err && rej(err)
      body && res(body)
    })
  })
}

const get_song_vibe = async id => {
  // trackAnalysis: 'https://api.spotify.com/v1/audio-analysis/'


  const url = `https://api.spotify.com/v1/audio-features/${id}`
  const headers = auth_headers()

  const options = {
    url,
    headers
  }

  const response = await request({ options, method: 'get' })
  const {
    danceability,
    energy,
    key,
    loudness,
    mode,
    speechiness,
    acousticness,
    instrumentalness,
    liveness } = JSON.parse(response)
    console.log({    danceability,
      energy,
      key,
      loudness,
      mode,
      speechiness,
      acousticness,
      instrumentalness,
      liveness})
}

const get_song_context = async id => {
  const url = `https://api.spotify.com/v1/audio-analysis/${id}`
  const headers = auth_headers()

  const options = {
    url,
    headers
  }

  const response = await request({ options, method: 'get' })
  console.log(response)
}



const get_currently_playing = async () => {
  const headers = auth_headers()
  const url = 'https://api.spotify.com/v1/me/player'

  const options = {
    url,
    headers
  }


  const response = await request({ options, method: 'get' })
  const { item } = JSON.parse(response)
  const { id, album, artists } = item
  get_song_vibe(id)
  get_song_context(id)
}




express.get('/callback', async (req, res) => {
  const { code } = req.query


  const options = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      'code': code,
      'grant_type': 'authorization_code',
      'redirect_uri': 'http://localhost:3000/callback'
    },
    headers: {
      Authorization: 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  }
  const response = await request({ options, method: 'post' })
  const { access_token, refresh_token } = response

  Object.assign(state, { access_token, refresh_token })

  state.access_token && get_currently_playing()
})








const cooldog = {
  "device": {
    "id": "ddfbd0c5c5b9ed67e147c28d73ba2ffa394b0d14",
    "is_active": true,
    "is_private_session": false,
    "is_restricted": false,
    "name": "DESKTOP-TMG11TA",
    "type": "Computer",
    "volume_percent": 50
  },
  "shuffle_state": true,
  "repeat_state": "off",
  "timestamp": 1578068109188,
  "context": {
    "external_urls": {
      "spotify": "https://open.spotify.com/playlist/5ZRKKghVLZ0Gvt5xYx7r7d"
    },
    "href": "https://api.spotify.com/v1/playlists/5ZRKKghVLZ0Gvt5xYx7r7d",
    "type": "playlist",
    "uri": "spotify:user:1158078216:playlist:5ZRKKghVLZ0Gvt5xYx7r7d"
  },
  "progress_ms": 207416,
  "item": {
    "album": {
      "album_type": "album",
      "artists": [{
        "external_urls": {
          "spotify": "https://open.spotify.com/artist/5me0Irg2ANcsgc93uaYrpb"
        },
        "href": "https://api.spotify.com/v1/artists/5me0Irg2ANcsgc93uaYrpb",
        "id": "5me0Irg2ANcsgc93uaYrpb",
        "name": "The Notorious B.I.G.",
        "type": "artist",
        "uri": "spotify:artist:5me0Irg2ANcsgc93uaYrpb"
      }],

      "external_urls": {
        "spotify": "https://open.spotify.com/album/2HTbQ0RHwukKVXAlTmCZP2"
      },
      "href": "https://api.spotify.com/v1/albums/2HTbQ0RHwukKVXAlTmCZP2",
      "id": "2HTbQ0RHwukKVXAlTmCZP2",
      "images": [{
        "height": 640,
        "url": "https://i.scdn.co/image/ab67616d0000b273a4950162a626593b7340f6c7",
        "width": 640
      }, {
        "height": 300,
        "url": "https://i.scdn.co/image/ab67616d00001e02a4950162a626593b7340f6c7",
        "width": 300
      }, {
        "height": 64,
        "url": "https://i.scdn.co/image/ab67616d00004851a4950162a626593b7340f6c7",
        "width": 64
      }],
      "name": "Ready to Die (The Remaster)",
      "release_date": "1994-09-13",
      "release_date_precision": "day",
      "total_tracks": 19,
      "type": "album",
      "uri": "spotify:album:2HTbQ0RHwukKVXAlTmCZP2"
    },
    "artists": [{
      "external_urls": {
        "spotify": "https://open.spotify.com/artist/5me0Irg2ANcsgc93uaYrpb"
      },
      "href": "https://api.spotify.com/v1/artists/5me0Irg2ANcsgc93uaYrpb",
      "id": "5me0Irg2ANcsgc93uaYrpb",
      "name": "The Notorious B.I.G.",
      "type": "artist",
      "uri": "spotify:artist:5me0Irg2ANcsgc93uaYrpb"
    }],

    "disc_number": 1,
    "duration_ms": 304146,
    "explicit": true,
    "external_ids": {
      "isrc": "USBB40580807"
    },
    "external_urls": {
      "spotify": "https://open.spotify.com/track/1xIxMz1sNQ4b6svH1GuTtF"
    },
    "href": "https://api.spotify.com/v1/tracks/1xIxMz1sNQ4b6svH1GuTtF",
    "id": "1xIxMz1sNQ4b6svH1GuTtF",
    "is_local": false,
    "name": "Gimme the Loot - 2005 Remaster",
    "popularity": 65,
    "preview_url": "https://p.scdn.co/mp3-preview/1fff52e2ba755ce44a53068cff15bd12e4e867e9 ? cid = fd067588863a4abb8233dea0581fec73",
    "track_number": 3,
    "type": "track",
    "uri": "spotify:track:1xIxMz1sNQ4b6svH1GuTtF"
  },
  "currently_playing_type": "track",
  "actions": {
    "disallows": {
      "resuming": true
    }
  },
  "is_playing": true
}
