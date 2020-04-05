require('dotenv').config({ path: __dirname + '../../.env' })
const _request = require('request')
const fs = require('fs')
const path = require('path')

const { eventHub } = require('../utils/eventHub')
const { isEqual } = require('../utils/helpers')


const auth = {
  access_token: '',
  refresh_token: ''
}

const auth_headers = () => ({
  'Authorization': 'Bearer ' + auth.access_token,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
})

const request = async ({ options, method }) => {
  !options['headers'] && (options['headers'] = auth_headers())
  return new Promise((res, rej) => {
    _request[method](options, (err, response, body) => {
      err && rej(err)
      body && res(body)
    })
  })
}

let syncInterval
let pingInterval

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
  eventHub.emit('vibeRecieved', JSON.parse(response))
  eventHub.on('vibeRecieved', item => console.log(item))
}

let syncTime = 0
eventHub.on('addSyncTime', () => {
  syncTime += 50
})

eventHub.on('removeSyncTime', () => {
  syncTime -= 50
})

const removeLastS = ([...str]) => str.reverse().slice(1, str.length).reverse().join('')

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
      eventHub.emit(removeLastS(type), [active_interval[type], index])
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

  intervalTypes.forEach(t => {
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

  syncInterval = setInterval(() => {
    track.progress_ms = (Date.now() - initial_progress_ms) + initial_track_progress
    set_active_intervals()
  }, 10)
}

const resetVariables = () => {
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
  try {


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
      clearInterval(syncInterval)
      resetVariables()
      Object.assign(track, { id, tick, album, artists, duration_ms, progress_ms, is_playing, last_sync_id: id })
      getSongVibe()
      getSongContext()
    }
  } catch (error) {
    console.log(error)
  }
}


eventHub.on('startPingInterval', () => {
  if (auth.access_token) {
    pingInterval = setInterval(() => getCurrentlyPlaying(), 5000)
  } else {
    console.log('no auth token bruv')
  }
})

eventHub.on('clearPingInterval', () => {
  clearInterval(syncInterval)
  clearInterval(pingInterval)
})

eventHub.on('authRecieved', recievedAuth => {
  Object.assign(auth, recievedAuth)
  fs.writeFileSync(path.resolve(`${__dirname}/../utils/spotifyAuth`), JSON.stringify({ auth, timestamp: Date.now() }))
  getCurrentlyPlaying()

  eventHub.emit('startPingInterval')
})




//UTILITIES MADE FOR FASTER DEVELOPMENT
const quickStart = () => {
  const json = fs.readFileSync(path.resolve(`${__dirname}/../utils/spotifyAuth`))
  const { auth: _auth, timestamp } = JSON.parse(json)
  if (Date.now() - timestamp < 3600000) {
    Object.assign(auth, _auth)
    eventHub.emit('startPingInterval')
    eventHub.emit('quickStart')
  }
}

const { getGroups } = require('../services/groupHandler')
const { startStream, getGroupsAndStopStreams } = require('../services/socket')
const globalState = require('../utils/globalState')
eventHub.on('quickStart', () => {
  console.log('quickStart')
  getGroups().then(async groups => {
    globalState.currentGroup = groups[1]
    await getGroupsAndStopStreams()
    startStream()
    require('./lights')
  })
})


quickStart()