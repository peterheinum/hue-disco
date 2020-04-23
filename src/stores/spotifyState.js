
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
  current_sync_id: '',

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

const activeInterval = {
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

const resetActiveInterval = () => {
  Object.assign(activeInterval, {
    bars: {},
    beats: {},
    tatums: {},
    sections: {},
    segments: {},
  })
}

const resetLastIndex = () => {
  Object.assign(lastIndex, {
    bars: 0,
    beats: 0,
    tatums: 0,
    sections: 0,
    segments: 0
  })
}

const resetTrack = () => {
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
    current_sync_id: '',

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

const resetSongContext = () => {
  resetTrack()
  resetLastIndex()
  resetActiveInterval()
}

module.exports = {
  track,
  lastIndex,
  activeInterval,
  resetSongContext
}