require('dotenv').config({ path: __dirname + '../../.env' })
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { get } = require('lodash')

const { eventHub } = require('../utils/eventHub')
const { isEqual } = require('../utils/helpers')
const getNewToken = require('../auth/getNewToken')

const {
  track,
  resetSongContext,
  lastIndex,
  activeInterval
} = require('../stores/spotifyState')

const auth = {
  access_token: '',
  refresh_token: '',
  timestamp: 0
}

const headers = () => ({
  headers: {
    'Authorization': `Bearer ${auth.access_token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})

let syncInterval
let pingInterval

const intervalTypes = ['tatums', 'segments', 'beats', 'bars', 'sections']

const resetVariables = () => {
  clearInterval(syncInterval)
  resetSongContext()
}

const getData = obj => get(obj, 'data')

const removeLastS = ([...str]) => str.reverse().slice(1, str.length).reverse().join('')

const authIsValid = () => {
  const { timestamp } = auth
  return timestamp === 0
    ? false
    : Date.now() - timestamp < 3500000
}

const checkIfNewSong = data => {
  const { item, is_playing } = data
  if (!is_playing) return

  if (get(item, 'id') != track.current_sync_id) {
    return data
  }

  return Promise.reject({ error: null })
}

const reset = data => {
  resetVariables()
  eventHub.emit('newSong')
  return data
}

const getCurrentlyPlaying = () => {
  if (!authIsValid()) {
    console.log('Auth invalid needs new auth')
    return Promise.reject({ error: 'expired-auth' })
  }

  const url = 'https://api.spotify.com/v1/me/player'
  const options = { url, ...headers() }
  const tick = Date.now()

  return new Promise((resolve, reject) => {
    const resolveWithTick = data => resolve({ ...data, tick })

    axios(options)
      .then(getData)
      .then(resolveWithTick)
      .catch(reject)
  })
}

const extractMetaData = data => {
  const { item, progress_ms, is_playing, tick } = data
  if (!item || !is_playing) {
    return Promise.reject({ error: 'not-playing' })
  }

  const { id, album, artists, duration_ms } = item

  if (is_playing && id !== track.current_sync_id) {
    Object.assign(track, {
      id,
      tick,
      album,
      artists,
      duration_ms,
      progress_ms,
      is_playing,
      current_sync_id: id
    })
  }
}

const getSongVibe = () => {
  const url = `https://api.spotify.com/v1/audio-features/${get(track, 'id')}`
  const options = { url, ...headers() }
  return new Promise((resolve, reject) => {
    axios(options)
      .then(getData)
      .then(resolve)
      .catch(reject)
  })
}

const extractVibeData = data => {
  Object.assign(track, data)
}

const getSongContext = () => {
  const url = `https://api.spotify.com/v1/audio-analysis/${get(track, 'id')}`
  const options = { url, ...headers() }
  return new Promise((resolve, reject) => {
    axios(options)
      .then(getData)
      .then(resolve)
      .catch(reject)
  })
}

const extractAudioAnalysis = data => {
  const { meta, bars, beats, tatums, sections, segments } = data
  Object.assign(track, { meta, bars, beats, tatums, sections, segments })
}

const fixSync = () => {
  const { tick, progress_ms } = track
  const tock = Date.now() - tick
  const initial_track_progress = progress_ms + tock
  const initial_progress_ms = Date.now()
  Object.assign(track, {
    progress_ms: progress_ms + tock + 500,
    initial_track_progress,
    initial_progress_ms
  })
}

const formatIntervals = () => {
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
}

/* Used for changing the sync live */
let syncTime = 0
eventHub.on('addSyncTime', () => {
  syncTime += 10
})

eventHub.on('removeSyncTime', () => {
  syncTime -= 10
})

const toPositive = negativeNum => negativeNum - (negativeNum * 2)

const distanceToNext = (index, nextIndex, type) => track[type][nextIndex] && toPositive(track[type][index].start - track[type][nextIndex].start)

const intro = {
  'tatums': [], 
  'segments': [], 
  'beats': [], 
  'bars': [], 
  'sections': []
}
const somethingElse = {
  'tatums': [], 
  'segments': [], 
  'beats': [], 
  'bars': [], 
  'sections': []
}

let avarage = 0
const setActiveInterval = () => {
  const determineInterval = type => {
    const analysis = track[type]
    const progress = track.progress_ms + syncTime //Synctime is a varible changed through frontend
    for (let i = 0; i < analysis.length; i++) {
      if (i === (analysis.length - 1)) return i
      if (analysis[i].start < progress && progress < analysis[i + 1].start) return i
    }
  }

  intervalTypes.forEach(type => {
    const index = determineInterval(type)
    if (!isEqual(track[type][index], activeInterval[type])) {
      activeInterval[type] = track[type][index]
      lastIndex[type] = index
      eventHub.emit(removeLastS(type), [activeInterval[type], index, distanceToNext(index, index + 1, type)])
      // type === 'segments' && console.log('compared to avarage', (activeInterval[type].loudness_max/avarage).toFixed(3), '%')
      // if(track.progress_ms > 30000 && track.progress_ms < 60000) intro[type].push(activeInterval[type])
      // if(track.progress_ms > 60000 && track.progress_ms < 90000) somethingElse[type].push(activeInterval[type]) 
    }
  })
  // if(track.progress_ms > 90000) {
  //   fs.writeFileSync('intro.txt', JSON.stringify(intro, null, 4))
  //   fs.writeFileSync('somethingElse.txt', JSON.stringify(somethingElse, null, 4))
  //   process.exit()
  // }
} 

const calculateAvarageLoudnessMax = () => {
  //TODO, SPLIT AVARAGE INTO THE DIFFERENT SEGMENTS FOR BETTER COMPARISON
  const total = track.segments.map(({ loudness_max }) => loudness_max).reduce((acc, cur) => acc += cur, 0)
  avarage = total/track.segments.length
  console.log(avarage)
  console.log(avarage)
  console.log(avarage)
  console.log(avarage)
  console.log(avarage)
  console.log(avarage)
}

const startSongSync = () => {
  formatIntervals()
  calculateAvarageLoudnessMax() 
  fixSync()

  syncInterval = setInterval(() => {
    track.progress_ms = (Date.now() - get(track, 'initial_progress_ms')) + get(track, 'initial_track_progress')
    setActiveInterval()
  }, 10)
}

const handleExpiredAuth = () => {
  clearInterval(pingInterval)
  getNewToken()
}

const handleSyncErrors = ({ error }) => {
  error === 'expired-auth' && handleExpiredAuth()
  console.warn({error})
}

const sync = () => {
  getCurrentlyPlaying()
    .then(checkIfNewSong)
    .then(reset)
    .then(extractMetaData)
    .then(getSongVibe)
    .then(extractVibeData)
    .then(getSongContext)
    .then(extractAudioAnalysis)
    .then(startSongSync)
    .catch(handleSyncErrors)
}

eventHub.on('startPingInterval', () => {
  if (authIsValid()) {
    pingInterval = setInterval(() => sync(), 5000)
  }
})

eventHub.on('authRecieved', recievedAuth => {
  const timestamp = Date.now()
  Object.assign(auth, { ...recievedAuth, timestamp })
  fs.writeFileSync(path.resolve(`${__dirname}/../utils/spotifyAuth`), JSON.stringify({ auth, timestamp }))
  eventHub.emit('startPingInterval')
})







//UTILITIES MADE FOR FASTER DEVELOPMENT
const quickStartIfPossible = () => {
  const filePath = path.resolve(`${__dirname}/../utils/spotifyAuth`)
  const json = fs.readFileSync(filePath)
  if (!json.toString()) return

  const { auth: _auth, timestamp } = JSON.parse(json) ? JSON.parse(json) : {}
  if (!timestamp) return
  if (Date.now() - timestamp < 3600000) {
    Object.assign(auth, { ..._auth, timestamp })
    eventHub.emit('startPingInterval')
    eventHub.emit('quickStart')
  }
}

eventHub.on('quickStart', () => {
  const { getGroups } = require('../services/groupHandler')
  const { startStream, getGroupsAndStopStreams } = require('../services/socket')
  const globalState = require('../stores/globalState')
  
  console.log('quickStart')
  getGroups().then(groups => {

    /* remove this when group is changed */
    globalState.currentGroup = groups[1]
    // globalState.currentGroup = groups[0]
    
    getGroupsAndStopStreams()
    .then(startStream)
    .then(() => require('./LightLab/lights'))
    .then(() => require('./LightLab/keyboard'))
    .then(() => require('../midi'))
  })
})

quickStartIfPossible()
// eventHub.emit('quickStart')

