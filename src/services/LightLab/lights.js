const { getRgbFromCssStr, rand, doubleRGB, round, sleep } = require('../../utils/helpers')
const convertPitchToNote = require('../../utils/convertPitchToNote')
const { eventHub } = require('../../utils/eventHub')
const { interpolateRgb } = require('d3-interpolate')
const state = require('../../stores/globalState')
const { get, set } = require('lodash')
const eventhub = require('../../utils/eventHub')

/* UTILS */
const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`

const roundRgb = ({ r, g, b }) => ({ r: round(r), g: round(g), b: round(b) })

const randomRgb = () => roundRgb({ r: rand(255), g: rand(255), b: rand(255) })

const getRgb = ({ r, g, b }) => ({ r, g, b })

const changeIntensity = ({ r, g, b }, intensity) => roundRgb({ r: intensity * r, g: intensity * g, b: intensity * b })

const isBusy = id => getLight(id).busy

const removeAllBusy = () => lightLoop().forEach(id => setLight(id, { busy: false }))

const setLight = (id, value) => {
  !getLight(id)
    ? set(state, `lights.${id}`, { ...value, capacity: 100 })
    : Object.assign(getLight(id), { ...value, capacity: 100 })
}

const getLight = id => get(state, `lights.${id}`)

const getLights = () => get(state, 'lights')

const setMode = mode => set(state, 'mode', mode)

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
  console.log('new color map ', colorMap)
  Object.assign(state.colorMap, colorMap)
})

if (state.currentGroup === null) {
  state.currentGroup = {}
  state.currentGroup.lights = ['1', '2', '3', '4', '5', '6']
}

const shuffle = arr => arr
  .map((a) => ({ sort: Math.random(), value: a }))
  .sort((a, b) => a.sort - b.sort)
  .map((a) => a.value)

const configurateVariables = () => {
  const freshState = {
    lights: {},
    mode: 'slow-intro',
    colorMap: {}
  }
  Object.assign(state, freshState)

  get(state, 'currentGroup.lights').forEach(id => {
    setLight(id, { id, ...zeroRgb, busy: false, tones: [], capacity: 100, floor: 70 })
  })

  Object.assign(state.colorMap, colorMap)
  // shuffle(Object.keys(colorMap)).forEach(tone => {
  Object.keys(colorMap).forEach(tone => {
    const { id } = withLeastTones()
    assignTone(id, tone)
  })
}

const isActive = id => state.activeLights.length ? state.activeLights.includes(id) : true

const last = {}

const emitLights = () => {
  const colorMessage = lightLoop().map(id => {
  // const colorMessage = lightLoop().filter(hasChanged).map(id => {
    const { r, g, b } = changeIntensity(getLight(id), state.currentIntensity)
    last[id] = { r, g, b }
    return [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)]
  })

  eventHub.emit('emitLight', colorMessage)
}

const tweenLightTo = (rgb, id, ms = 5000) => {
  const currentRgb = getRgbAsString(getLight(id))
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = interpolateRgb(currentRgb, destinationRgb)

  let i = 0
  return new Promise((resolve, reject) => {
    const _interval = setInterval(() => {
      if (i > 0.99) {
        const [r, g, b] = getRgbFromCssStr(interpolation(1))
        setLight(id, { r, g, b, busy: false })
        clearInterval(_interval)
        resolve()
      }

      i += 20 / ms
      const [r, g, b] = getRgbFromCssStr(interpolation(i))
      setLight(id, { r, g, b, busy: true })
    }, 20)
  })
}

const heartBeatAll = () => {
  lightLoop().forEach(id => {
    heartBeat(id)
  })
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
  setLight(id, { tones: [...getLight(id).tones, tone] })
}

const decreaseRate = 0.9
const dampenLights = () => {
  const { mode } = state
  if (mode === 'no-dampen') return

  lightLoop().forEach(id => {
    const { r, g, b, busy, capacity, floor } = getLight(id)
    // console.log(floor, capacity, capacity > floor)
    capacity > floor && !busy && setLight(id, { ...changeIntensity({ r, g, b }, decreaseRate), capacity: capacity * decreaseRate })
  })
}


const init = () => {
  configurateVariables()
  state.dampenInterval = setInterval(() => {
    state.hasSocket && emitLights()
    dampenLights()
  }, 50)
}



const stackFunctions = async stack => {
  for (let i = 0; i < stack.length; i++) {
    await stack[i]()
  }

  return Promise.resolve()
}

const transfer = (from, to, ms = 500) => {
  tweenLightTo(zeroRgb, from, ms)
  tweenLightTo(getRgb(getLight(from)), to, ms)
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

  duration > 1000
    ? tweenLightTo({ r, g, b }, id, duration)
    : setLight(id, { r, g, b, capacity: 100 })
})

const getDefaultColorForLight = (id, index) => {
  const tone = getTonesForLight(id)[index]
  const [r, g, b] = getRgbFromCssStr(getColorsForTone(tone))
  return { r, g, b }
}

const randomSlowIntro = (index, distanceToNext) => {
  const temp = index % 2 == 0 ? 0 : 1
  index % 2 == 0
    ? lightLoop().forEach(id => tweenLightTo(id % 2 === temp ? zeroRgb : randomRgb(), id, distanceToNext))
    : lightLoop().forEach(id => tweenLightTo(id % 2 !== temp ? randomRgb() : zeroRgb, id, distanceToNext))
}

const slowIntro = (index, distanceToNext) => {
  const temp = index % 2 == 0 ? 0 : 1
  index % 2 == 0
    ? lightLoop().forEach(id => tweenLightTo(id % 2 === temp ? zeroRgb : getDefaultColorForLight(id, index % 3 == 0 ? 1 : 0), id, distanceToNext))
    : lightLoop().forEach(id => tweenLightTo(id % 2 !== temp ? getDefaultColorForLight(id, index % 4 == 0 ? 1 : 0) : zeroRgb, id, distanceToNext))
}

eventHub.on('bar', ([bar, index, distanceToNext]) => {
  const { mode } = state

  const dictionary = [
    ['flashes', removeAllBusy],
    ['slow-intro', () => slowIntro(index, distanceToNext)],
    ['random-slow-intro', () => randomSlowIntro(index, distanceToNext)],
  ]
  //Enabled for flashes to be on
  removeAllBusy()
  index % 2 === 0 && heartBeatAll()
  // const [__, fn] = dictionary.find(([name]) => name === mode)
  // fn && fn()
  // const fn = () => slowIntro(index, distanceToNext)
  // fn()
  
})

eventHub.on('section', ([section, index]) => {
  // const modes = ['slow-intro'] //, 'flashes']
  const modes = ['flashes'] 
  const { mode } = state
  set(state, 'mode', modes.filter(x => x != mode)[rand(modes.filter(x => x != mode).length)])
})

let i = 0
eventHub.on('beat', ([beat, index]) => {
  const { mode } = state
  if (mode === 'escapade') {
    lightLoop().forEach(id => setLight(id, id === i ? maxRed : zeroRgb))
    i++
  }
})



const setSlowIntro = () => setMode('slow-intro')
const setFlashes = () => setMode('flashes')

eventHub.on('newSong', setFlashes)
init()

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

module.exports = {
  zeroRgb,
  setLight,
  heartBeat,
  randomRgb,
  slowIntro,
  lightLoop,
  emitLights,
  heartBeatAll,
  dampenLights,
  tweenLightTo,
  stackFunctions,
  changeIntensity,
  configurateVariables,
}