const convertPitchToNote = require('../../utils/convertPitchToNote')
const { eventHub } = require('../../utils/eventHub')
const { interpolateRgb } = require('d3-interpolate')
const state = require('../../stores/globalState')
const { get, set } = require('lodash')
const { 
  getRgbFromCssStr, 
  rand, 
  doubleRGB, 
  round, 
  callStack, 
  flat, 
  wait, 
  sleep, 
  randomFromArray, 
  findHandler,
  unique,
} = require('../../utils/helpers')
const {setState, getState, assignState, setLight} = require('../../stores/globalState')
const {find, pipe, includes, path} = require('ramda')
const {getVolumeOfSegment} = require('./visualConsole')

/* UTILS */
const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`

const roundRgb = ({ r, g, b }) => ({ r: round(r), g: round(g), b: round(b) })

const randomRgb = () => roundRgb({ r: rand(255), g: rand(255), b: rand(255) })

const getRgb = ({ r, g, b }) => ({ r, g, b })

const changeIntensity = ({ r, g, b }, intensity) => roundRgb({ r: intensity * r, g: intensity * g, b: intensity * b })

const isBusy = id => getLight(id).busy

const removeAllBusy = () => lightLoop().forEach(id => setLight(id, { busy: false }))

// const setLight = (id, value) => {
//   !getLight(id)
//     ? setState(`lights.${id}`, { ...value, capacity: 100 })
//     : Object.assign(getLight(id), { ...value, capacity: 100 })
// }

const getLight = id => getState(`lights.${id}`)

const getLights = () => getState(state, 'lights')

const setMode = mode => setState('mode', mode)

const lightLoop = () => {
  return Object.keys(getState('lights'))
}

const getColorsForTone = tone => getState(`colorMap.${tone}`)

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
  setState('colorMap', colorMap)
})

if (getState('currentGroup') === null) {
  setState('currentGroup', {}) 
  setState('currentGroup', { ...getState('currentGroup'), lights: ['1', '2', '3', '4', '5', '6'] }) 
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

  assignState(freshState)

  getState('currentGroup').lights.forEach(id => {
    setLight(id, { id, ...zeroRgb, busy: false, tones: [], capacity: 100, floor: 70 })
  })

  setState('colorMap', colorMap)

  Object.keys(colorMap).forEach(tone => {
    const { id } = withLeastTones()
    assignTone(id, tone)
  })
}

const emitLights = () => {
  const colorMessage = lightLoop().map(id => {
    const { r, g, b } = changeIntensity(getLight(id), getState('currentIntensity'))
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
        setTimeout(() => {
          resolve()
        }, 20)
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

const assignTone = (id, tone) => setLight(id, { tones: [...getLight(id).tones, tone] })

const decreaseRate = 0.99 //Chill
// const decreaseRate = 0.85
const dampenLights = () => {
  const { mode } = state
  if (mode === 'no-dampen') return

  lightLoop().forEach(id => {
    const { r, g, b, busy, capacity, floor } = getLight(id)
    capacity > floor && !busy && setLight(id, { ...changeIntensity({ r, g, b }, decreaseRate), capacity: capacity * decreaseRate })
  })
}


const init = () => {
  configurateVariables()
  setState('dampenInterval', setInterval(() => {
    getState('hasSocket') && emitLights()
    dampenLights()
  }, 50)) 
}


const transfer = (from, to, ms = 500) => {
  tweenLightTo(zeroRgb, from, ms).then(() => tweenLightTo(getRgb(getLight(from)), to, ms))
}

const heartBeat = id => {
  const fns = [
    () => tweenLightTo(changeIntensity(maxRed, 0.7), id, 200),
    () => tweenLightTo(zeroRgb, id, 100),
    () => tweenLightTo(maxRed, id, 200),
    () => tweenLightTo(zeroRgb, id, 400) 
  ]

  callStack(fns)
}

const sum = (acc, cur) => acc + cur
const getAvg = (arr) => arr.reduce(sum) / arr.length

const currentVolumes = []

const segmentWorthPlaying = (segment) => {
  const volume = getVolumeOfSegment(segment)
  currentVolumes.unshift(volume)
  if (currentVolumes.length > 5) currentVolumes.pop()
  const avg = getAvg(currentVolumes)
  return volume * 0.95 > avg
}

eventHub.on('segment', ([segment, index]) => {
  if (getState('mode') !== 'flashes' || !getState('dampenInterval')) {
    return
  }

  const { pitches } = segment
  if(!segmentWorthPlaying(segment)) return
  const tone = convertPitchToNote(pitches)
  const [r, g, b] = getRgbFromCssStr(getColorsForTone(tone))
  const { id } = getLightsForTone(tone)
  setLight(id, { r, g, b, capacity: 100 })
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

const slowIntro = async (index, distanceToNext) => {
  const temp = index % 2 == 0 ? 0 : 1
  index % 2 == 0
    ? lightLoop().forEach(id => tweenLightTo(id % 2 === temp ? zeroRgb : getDefaultColorForLight(id, index % 3 == 0 ? 1 : 0), id, distanceToNext))
    : lightLoop().forEach(id => tweenLightTo(id % 2 !== temp ? getDefaultColorForLight(id, index % 4 == 0 ? 1 : 0) : zeroRgb, id, distanceToNext))
}

eventHub.on('bar', ([bar, index, distanceToNext]) => {
  const { mode } = state

  const dictionary = [
    ['bounce', bounce],
    ['flashes', removeAllBusy],
    ['slow-intro', () => slowIntro(index, distanceToNext)],
    ['random-slow-intro', () => randomSlowIntro(index, distanceToNext)],
  ]
  const [__, handler] = findHandler(mode, dictionary)
  
  if (handler !== null) {
    handler()
  }
  // index % 2 == 0 && heartBeatAll()
})

eventHub.on('section', ([section, index]) => {
  const modes = ['slow-intro', 'random-slow-intro', 'bounce', 'flashes'] 
  // const modes = ['flashes'] 
  const { mode } = state
  const newMode = modes.filter(x => x != mode)[rand(modes.filter(x => x != mode).length)]
  setState('mode', 'flashes')
})

const raiseAll = () => lightLoop().map(getLight).forEach(light => {
  setLight(light.id, changeIntensity(getRgb(light), 1.05))
})

const getThreeLights = () => {
  const lights = []
  for (let i = 0; i < 3; i++) {
    lights.push(randomFromArray(lightLoop()))    
  }

  /* remove this when group is changed */
  return unique(lights)
}

const bounce = () => {
  const lights = getThreeLights()
  const color = randomRgb()
  const fns = createBounceCallstack(lights, color)
  callStack(fns)
}

eventHub.on('beat', ([beat, index]) => {
  const { mode } = state
  
  const dictionary = [
    // ['flashes', raiseAll]
  ]
  
  const [__, handler] = findHandler(mode, dictionary)
  
  if(handler) {
    handler()
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

const addDelayBetween = (fns) => flat(fns.map(fn => [fn, wait]))

const createLowerColors = (color, amount, floor = 0.1) => {
  const rate = Math.abs((1-floor)/amount - 1)
  
  const colors = [color]
  for (let i = 1; i < amount; i++) {
    colors.push(changeIntensity(color, (rate / i)))
  }
  
  return colors
}

const pSetLight = (id, color) => {
  setLight(id, color)
  return sleep(25)
}

const createBounceCallstack = (lights, color) => {
  const colors = createLowerColors(color, lights.length)

  const fns = lights.map((id, i) => () => pSetLight(id, colors[i]))
  return addDelayBetween(fns)
}

// const rows = [[1, 6, 3], [6, 1, 5], [3, 1, 5], [5, 1, 3]]
const rows = [[5, 1, 2], [2, 1, 5], [4, 1, 2], [1, 2, 4]]
const getRandomRow = () =>  randomFromArray(rows)

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
  changeIntensity,
  configurateVariables,
  createBounceCallstack,
}