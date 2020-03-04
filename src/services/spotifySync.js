require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')()
const bodyParser = require('body-parser')
const _request = require('request')
const compression = require('compression')

//Express config
express.use(compression())
express.use(bodyParser.json())
express.use(bodyParser.urlencoded({ extended: true }))
express.use('/', require('../auth/spotify_auth'))
express.use('/api/', require('./operations'))

express.use('/react', require('../routes/reactRenderer'))

express.use(require('express').static('public'))

express.listen(3000, () => console.log('Webhook server is listening, port 3000'))

const { eventHub } = require('../utils/eventhub')
const { isEqual } = require('../utils/helpers')

const request = async ({ options, method }) => {
  !options['headers'] && (options['headers'] = auth_headers())
  return new Promise((res, rej) => {
    _request[method](options, (err, response, body) => {
      err && rej(err)
      body && res(body)
    })
  })
}

const auth = {
  access_token: '',
  refresh_token: ''
}

let _interval

const track = {
  //Meta data
  id: '',
  artist: {},
  album: {},
  meta: {},

  //Time & Sync
  tick: 0,
  tock: 0,
  initial_track_progress: 0,
  progress_ms: 0,
  duration_ms: 0,
  is_playing: false,
  duration_ms: 0,
  song_is_synced: false,
  last_sync_id: '',

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

const intervalTypes = ['tatums', 'segments', 'beats', 'bars', 'sections']

const auth_headers = () => ({
  'Authorization': 'Bearer ' + auth.access_token,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
})

const active_interval = {
  bars: {},
  beats: {},
  tatums: {},
  sections: {},
  segments: {},
}

const lastIndex = {
  bars: 0,
  beats: 0,
  tatums: 0,
  sections: 0,
  segments: 0
}

const getSongVibe = async () => {
  const { id } = track
  const url = `https://api.spotify.com/v1/audio-features/${id}`

  const options = { url }

  const response = await request({ options, method: 'get' })

  Object.assign(track, JSON.parse(response))
  eventHub.emit('vibe_recieved', JSON.parse(response))
  eventHub.on('vibe_recieved', item => console.log(item))
}



let syncTime = 0
eventHub.on('addSyncTime', () => {
  syncTime += 50
})

eventHub.on('removeSyncTime', () => {
  syncTime -= 50
})



const set_active_intervals = () => {
  const determineInterval = (type) => {
    const analysis = track[type]
    const progress = track.progress_ms + syncTime
    for (let i = 0; i < analysis.length; i++) {
      if (i === (analysis.length - 1)) return i
      if (analysis[i].start < progress && progress < analysis[i + 1].start) return i
    }
  }

  intervalTypes.forEach(type => {
    const index = determineInterval(type)
    if (!isEqual(track[type][index], active_interval[type]) && lastIndex[type] < index) {
      active_interval[type] = track[type][index]
      lastIndex[type] = index
      eventHub.emit(type, {...active_interval, index })
    }
  })
}


const getSongContext = async () => {
  const { id } = track
  const url = `https://api.spotify.com/v1/audio-analysis/${id}`

  const options = { url }
  const response = await request({ options, method: 'get' })
  const { meta, bars, beats, tatums, sections, segments } = JSON.parse(response)

  Object.assign(track, { meta, bars, beats, tatums, sections, segments })

  intervalTypes.forEach((t) => {
    const type = track[t]
    type[0].duration = type[0].start + type[0].duration
    type[0].start = 0
    type[type.length - 1].duration = (track.duration_ms / 1000) - type[type.length - 1].start
    type.forEach(interval => {
      if (interval.loudness_max_time) {
        interval.loudness_max_time = interval.loudness_max_time * 1000
      }

      interval.start = interval.start * 1000
      interval.duration = interval.duration * 1000
    })
  })

  const tock = Date.now() - track.tick
  const initial_track_progress = track.progress_ms + tock
  const progress_ms = track.progress_ms + tock - 500
  const initial_progress_ms = Date.now()

  Object.assign(track, { initial_track_progress, progress_ms, initial_progress_ms })

  _interval = setInterval(() => {
    track.progress_ms = (Date.now() - initial_progress_ms) + initial_track_progress
    set_active_intervals()
  }, 10)
}

const reset_variables = () => {
  Object.assign(active_interval, {
    bars: {},
    beats: {},
    tatums: {},
    sections: {},
    segments: {},
  })

  Object.assign(lastIndex, {
    bars: 0,
    beats: 0,
    tatums: 0,
    sections: 0,
    segments: 0
  })

  Object.assign(track, {
    //Meta data
    id: '',
    artist: {},
    album: {},
    meta: {},

    //Time & Sync
    tick: 0,
    tock: 0,
    initial_track_progress: 0,
    progress_ms: 0,
    duration_ms: 0,
    is_playing: false,
    duration_ms: 0,
    song_is_synced: false,
    last_sync_id: '',

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
  })
}

const track_on_track = (progress_ms) => 
  progress_ms + 200 > track.progress_ms && 
  progress_ms - 200 < track.progress_ms

const getCurrentlyPlaying = async () => {
  const url = 'https://api.spotify.com/v1/me/player'

  const options = { url }
  const tick = Date.now()
  const response = await request({ options, method: 'get' })
  if (response.error) {
    eventHub.emit('renew_spotify_token')
    console.error('error:', response)
    return
  }

  const { item, progress_ms, is_playing } = JSON.parse(response)
  const { id, album, artists, duration_ms } = item
  if (is_playing && id !== track.last_sync_id && !track_on_track()) {
    clearInterval(_interval)
    reset_variables()
    Object.assign(track, { id, tick, album, artists, duration_ms, progress_ms, is_playing, last_sync_id: id })
    getSongVibe()
    getSongContext()
    console.log('aaaa')
  }
}


eventHub.on('auth_recieved', recievedAuth => {
  console.log('AUTH RECIEVED BABTYYYY,', recievedAuth)
  Object.assign(auth, recievedAuth) 
  getCurrentlyPlaying()

  setInterval(() => {
    getCurrentlyPlaying()
  }, 5000)
})
