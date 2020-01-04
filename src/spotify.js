require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')()
const bodyParser = require('body-parser')
const _request = require('request')

express.use(bodyParser.json())
express.use(bodyParser.urlencoded({ extended: true }))
express.listen(3000, () => console.log('Webhook server is listening, port 3000'))


const auth = {
  access_token: '',
  refresh_token: ''
}

const track = {
  //Meta data
  id: '',
  artist: {},
  album: {},
  meta: {},

  //Time & Sync
  initial_progress_ms: 0,
  progress_ms: 0,
  duration_ms: 0,

  //Vibe
  danceability: 0,
  energy: 0,
  key: 0,
  loudness: 0,
  mode: 0,
  speechiness: 0,
  acousticness: 0,
  instrumentalness: 0,
  liveness: 0,
  tempo: 0,

  //Analytics
  bars: [],
  beats: [],
  tatums: [],
  sections: [],
  segments: [],
}


const auth_headers = () => ({
  'Authorization': 'Bearer ' + auth.access_token,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
})

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const redirect_uri = encodeURIComponent('http://localhost:3000/callback')

// currentlyPlaying: 'https://api.spotify.com/v1/me/player',
// trackAnalysis: 'https://api.spotify.com/v1/audio-analysis/',
// trackFeatures: 'https://api.spotify.com/v1/audio-features/',


express.get('/', async (req, res) => {
  const scopes = 'user-read-playback-state'
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

const get_song_vibe = async () => {
  const { id } = track
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
    liveness,
    tempo } = JSON.parse(response)

  Object.assign(track, { danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, tempo })
}

const current = {
  bars: {},
  beats: {},
  tatums: {},
  sections: {},
  segments: {},
}

const determineInterval = (type) => {
  const analysis = track[type]
  const progress = track.progress_ms
  for (let i = 0; i < analysis.length; i++) {
    if (i === (analysis.length - 1)) return i
    if (analysis[i].start < progress && progress < analysis[i + 1].start) return i
  }
}

const intervalTypes = ['tatums', 'segments', 'beats', 'bars', 'sections']

const set_active_intervals = () => {
  
  intervalTypes.forEach(type => {
    const index = determineInterval(type)
    if(JSON.stringify(track[type][index]) != JSON.stringify(current[type])) {
      current[type] = track[type][index]
      type == 'beats' && console.log(current['beats'])
    }
  })
}

const get_song_context = async (data) => {
  const { id } = track
  const url = `https://api.spotify.com/v1/audio-analysis/${id}`
  const headers = auth_headers()

  const options = {
    url,
    headers
  }

  const response = await request({ options, method: 'get' })

  const { meta, bars, beats, tatums, sections, segments } = JSON.parse(response)

  Object.assign(track, { meta, bars, beats, tatums, sections, segments })

  intervalTypes.forEach((t) => {
    const type = track[t]
    type[0].duration = type[0].start + type[0].duration
    type[0].start = 0
    type[type.length - 1].duration = (track.duration_ms / 1000) - type[type.length - 1].start
    type.forEach((interval) => {
      if (interval.loudness_max_time) {
        interval.loudness_max_time = interval.loudness_max_time * 1000
      }
      interval.start = interval.start * 1000
      interval.duration = interval.duration * 1000
    })
  })

  setInterval(() => {
    track.progress_ms = Date.now() - track.initial_progress_ms
    set_active_intervals()
  }, 5)
}


const get_currently_playing = async () => {
  const headers = auth_headers()
  const url = 'https://api.spotify.com/v1/me/player'

  const options = {
    url,
    headers
  }

  const t1 = Date.now()

  const response = await request({ options, method: 'get' })

  const t2 = Date.now()
  const time_diff = t2 - t1

  const { item, progress_ms } = JSON.parse(response)
  const { id, album, artists, duration_ms } = item
  const initial_progress_ms = t1 - time_diff

  Object.assign(track,
    {
      id,
      album,
      artists,
      duration_ms,
      initial_progress_ms,
      progress_ms: progress_ms - time_diff
    }
  )
  
  get_song_vibe()
  get_song_context()
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

  Object.assign(auth, { access_token, refresh_token })

  auth.access_token && get_currently_playing()
})