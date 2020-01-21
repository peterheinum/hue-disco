require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')()
const bodyParser = require('body-parser')
const _request = require('request')
const compression = require('compression')

//Express config
express.use(compression())
express.use(bodyParser.json())
express.use(bodyParser.urlencoded({ extended: true }))
express.use('/', require('./spotify_auth'))
express.use('/home', require('./home'))
express.use('/api', require('./operations'))

express.listen(3000, () => console.log('Webhook server is listening, port 3000'))

const { event_hub } = require('./eventhub')
const { is_equal } = require('./utils')

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

const last_index = {
  bars: 0,
  beats: 0,
  tatums: 0,
  sections: 0,
  segments: 0
}

const request = async ({ options, method }) => {
  !options['headers'] && (options['headers'] = auth_headers())
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

  const options = { url }

  const response = await request({ options, method: 'get' })

  Object.assign(track, JSON.parse(response))
  event_hub.emit('vibe_recieved', JSON.parse(response))
}

const set_active_intervals = () => {
  const determineInterval = (type) => {
    const analysis = track[type]
    const progress = track.progress_ms
    for (let i = 0; i < analysis.length; i++) {
      if (i === (analysis.length - 1)) return i
      if (analysis[i].start < progress && progress < analysis[i + 1].start) return i
    }
  }

  intervalTypes.forEach(type => {
    const index = determineInterval(type)
    if (!is_equal(track[type][index], active_interval[type]) && last_index[type] < index) {
      active_interval[type] = track[type][index]
      last_index[type] = index
      event_hub.emit(type, {...active_interval, index })
    }
  })
}


const get_song_context = async () => {
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

  Object.assign(last_index, {
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

const get_currently_playing = async () => {
  const url = 'https://api.spotify.com/v1/me/player'

  const options = { url }
  const tick = Date.now()
  const response = await request({ options, method: 'get' })

  if (response.error) {
    event_hub.emit('renew_spotify_token')
    console.error('error:', response)
    return
  }

  const { item, progress_ms, is_playing } = JSON.parse(response)
  const { id, album, artists, duration_ms } = item
  if (is_playing && id !== track.last_sync_id && !track_on_track()) {
    reset_variables()
    clearInterval(_interval)
    Object.assign(track, { id, tick, album, artists, duration_ms, progress_ms, is_playing, last_sync_id: id })
    get_song_vibe()
    get_song_context()
  }
}


event_hub.on('auth_recieved', recieved_auth => {
  Object.assign(auth, recieved_auth)
  get_currently_playing()

  setInterval(() => {
    get_currently_playing()
  }, 5000)
})
