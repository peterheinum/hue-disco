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
express.listen(3000, () => console.log('Webhook server is listening, port 3000'))

const { event_hub } = require('./eventhub')
const { is_equal } = require('./utils')

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
  tick: 0,
  tock: 0,
  initial_track_progress: 0,
  progress_ms: 0,
  duration_ms: 0,
  is_playing: false,
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
    if(!is_equal(track[type][index], active_interval[type])) {
      active_interval[type] = track[type][index]

      event_hub.emit(type, track[type][index])
      type == 'sections' && console.log(active_interval[type])
      type == 'beats' && console.log('BEAT ' + active_interval[type].start)
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
  const progress_ms = track.progress_ms + tock
  const initial_progress_ms = Date.now()

  Object.assign(track, { initial_track_progress, progress_ms, initial_progress_ms })

  const restart = interval => {
    clearInterval(interval)
    get_currently_playing()
  }

  const is_song_over = () => {
    const { progress_ms, duration_ms } = track
    return progress_ms > duration_ms - 1000
  }

  let interval = setInterval(() => {
    track.progress_ms = (Date.now() - initial_progress_ms) + initial_track_progress
    is_song_over() ? restart(interval) : set_active_intervals()
  }, 5)
}

const get_currently_playing = async () => {
  const url = 'https://api.spotify.com/v1/me/player'

  const options = { url }
  const tick = Date.now()

  const response = await request({ options, method: 'get' })

  const { item, progress_ms } = JSON.parse(response)
  const { id, album, artists, duration_ms } = item

  Object.assign(track, { id, tick, album, artists, duration_ms, progress_ms })
  
  get_song_vibe()
  get_song_context()
}

event_hub.on('auth_recieved', recieved_auth => Object.assign(auth, recieved_auth) && get_currently_playing())