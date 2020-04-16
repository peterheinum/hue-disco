const { getRgbFromCssStr, rand, doubleRGB, round, sleep } = require('../utils/helpers')
const globalState = require('../utils/globalState')
const { interpolateRgb } = require('d3-interpolate')
const { eventHub } = require('../utils/eventHub')
const { get, set } = require('lodash')
const convertPitchToNote = require('../utils/convertPitchToNote')

/* UTILS */
const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`
const roundRgb = ({ r, g, b }) => ({ r: round(r), g: round(g), b: round(b) })
const getRgb = ({ r, g, b }) => ({ r, g, b })
const changeIntensity = ({ r, g, b }, intensity) => roundRgb({ r: intensity * r, g: intensity * g, b: intensity * b })
const isBusy = id => getLight(id).busy


/* State */
const state = {
  lights: {},
  mode: '',
  colorMap: {}
}

let lights = {}

const setLight = (id, value) => {
  !getLight(id)
    ? set(state, `lights.${id}`, value)
    : Object.assign(getLight(id), value)
}

const getLight = id => get(state, `lights.${id}`)
const getLights = () => get(state, 'lights')
const lightLoop = () => Object.keys(get(state, 'lights'))
const getColorsForTone = tone => get(state, `colorMap.${tone}`)

/* Color variables */
const zeroRgb = { r: 0, g: 0, b: 0 }
const white = { r: 255, g: 255, b: 255 }
const maxRed = { r: 240, g: 0, b: 0 }
const maxGreen = { r: 0, g: 255, b: 0 }
const maxBlue = { r: 0, g: 0, b: 255 }
const maxPurple = { r: 255, g: 0, b: 255 }
const halfRed = { r: 50, g: 0, b: 0 }

const colorMap = {
  'C': 'rgb(255, 113, 206)',
  'C#': 'rgb(1, 205, 254)',
  'D': 'rgb(5, 255, 161)',
  'D#': 'rgb(185, 103, 255)',
  'E': 'rgb(255, 251, 150)',
  'F': 'rgb(255, 113, 206)',
  'F#': 'rgb(1, 205, 254)',
  'G': 'rgb(5, 255, 161)',
  'G#': 'rgb(185, 103, 255)',
  'A': 'rgb(255, 251, 150)',
  'A#': 'rgb(1, 205, 254)',
  'B': 'rgb(255, 113, 206)'
}

eventHub.on('setColors', colorMap => {
  Object.assign(state.colorMap, colorMap)
})

if (globalState.currentGroup === null) {
  globalState.currentGroup = {}
  globalState.currentGroup.lights = ['1', '2', '3', '4', '5', '6']
}

const shuffle = arr => arr
  .map((a) => ({ sort: Math.random(), value: a }))
  .sort((a, b) => a.sort - b.sort)
  .map((a) => a.value)

const configurateVariables = () => {
  get(globalState, 'currentGroup.lights').forEach(id => {
    setLight(id, { id, ...zeroRgb, busy: false, tones: [], interval: null, busyCount: 0 })
  })


  Object.assign(state.colorMap, colorMap)
  shuffle(Object.keys(colorMap)).forEach(tone => {
    const { id } = withLeastTones()
    assignTone(id, tone)
  })
}

const emitLights = () => {
  const colorMessage = lightLoop().map(id => {
    const { r, g, b } = changeIntensity(getLight(id), 0.7)
    return [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)]
  })

  eventHub.emit('emitLight', colorMessage)
}



const tweenLightTo = (rgb, id, ms = 5000) => {
  // console.log('twening', id, 'to ', rgb, 'from ', getRgb(lights[id]))
  const currentRgb = getRgbAsString(getLight(id))
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = interpolateRgb(currentRgb, destinationRgb)

  let i = 0
  return new Promise((resolve, reject) => {
    const _interval = setInterval(() => {
      if (i > 0.99) {
        const [r, g, b] = getRgbFromCssStr(interpolation(1))
        // Object.assign(lights[id], { r, g, b, busy: false })
        setLight(id, { r, g, b, busy: false })
        clearInterval(_interval)
        resolve()
      }

      i += 20 / ms
      const [r, g, b] = getRgbFromCssStr(interpolation(i))
      setLight(id, { r, g, b, busy: true })
      // Object.assign(lights[id], { r, g, b, busy: true })
    }, 20)
  })
}

const heartBeatAll = () => {
  lightLoop().forEach(id => {
    heartBeat(id)
  })
}

const removeBusy = () => {
  lightLoop().forEach(id => setLight(id, { r, g, b, busy: false }))
}

const getTonesForLight = id => getLight(id).tones

const getLightsForTone = tone => {
  let light = null
  lightLoop().forEach(id => {
    const tones = getTonesForLight(id)
    if (tones.includes(tone)) {
      light = getLight(id)
    }
  })
  return light
}

const withLeastTones = () => {
  const id = lightLoop().sort((a, b) => getLight(a).tones.length - getLight(b).tones.length)[0]
  return { id }
}

const assignTone = (id, tone) => {
  setLight(id, { tones: [...getLight(id).tones ,tone]})
}




const dampenLights = () => {
  const { mode } = state
  if (mode === 'no-dampen') return
  const _lights = getLights()

  Object.keys(_lights).forEach(id => {
    const { r, g, b, busy } = _lights[id]
    !busy && setLight(id, changeIntensity({ r, g, b }, 0.9))
  })
}


const init = () => {
  const freshState = {
    lights: {},
    mode: '',
    colorMap: {}
  }
  Object.assign(state, freshState)

  configurateVariables()
  setInterval(() => {
    globalState.hasSocket && emitLights()
    dampenLights()
  }, 70)
}

init()

const stackFunctions = async stack => {
  for (let i = 0; i < stack.length; i++) {
    await stack[i]()
  }

  return Promise.resolve()
}

const transfer = (from, to, ms = 500) => {
  tweenLightTo(zeroRgb, from, ms)
  tweenLightTo(getRgb(lights[from]), to, ms)
}

const heartBeat = id => {
  const a = () => tweenLightTo(changeIntensity(maxRed, 0.7), id, 200)
  const b = () => tweenLightTo(zeroRgb, id, 100)
  const c = () => tweenLightTo(maxRed, id, 200)
  const d = () => tweenLightTo(zeroRgb, id, 400)

  stackFunctions([a, b, c, d])
}


eventHub.on('segment', ([segment, index]) => {
  if (get(state, 'mode') !== 'flashes') {
    return
  }

  const { pitches, duration, loudness_start, loudness_max, loudness_max_time } = segment
  const tone = convertPitchToNote(pitches)
  const [r, g, b] = getRgbFromCssStr(getColorsForTone(tone))
  const { id } = getLightsForTone(tone)

  if (globalState.hasSocket && !isBusy(id)) {
    duration > 1000
      ? tweenLightTo({ r, g, b }, id, duration)
      // : Object.assign(lights[id], { r, g, b })
      : setLight(id, { r, g, b })
  }
})

eventHub.on('bar', ([bar, index, distanceToNext]) => {
  const { mode } = state

  if (mode === 'slowIntro') {
    index % 2 == 0
      ? lightLoop().forEach(id => tweenLightTo(id % 2 === 0 ? zeroRgb : maxRed, id, distanceToNext))
      : lightLoop().forEach(id => tweenLightTo(id % 2 !== 0 ? zeroRgb : maxRed, id, distanceToNext))
  }

  if (mode === 'heartbeat') {
    heartBeatAll()
  }
})

eventHub.on('section', ([section, index]) => {
  const { mode } = state
  mode === 'no-dampen'
    ? set(state, 'mode', 'no-dampen')
    : set(state, 'mode', 'flashes')
})



eventHub.on('letsgo', () => {
  // set(state, 'mode', 1)
  // infiniteTween([false, true])
})

const infiniteTween = ([dark, next, intervalLength = 500]) => {
  const orange = { r: 255, g: 165, b: 0 }

  const currentTween = dark
    ? changeIntensity(orange, 0.5)
    : changeIntensity(maxRed, 0.5)

  lightLoop().forEach(id => {
    tweenLightTo(currentTween, id, intervalLength)
  })

  setTimeout(() => {
    const nextTween = dark
      ? [!dark, !next]
      : [!dark, next]

    infiniteTween(nextTween)
  }, intervalLength + 500)
}