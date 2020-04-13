const { getRgbFromCssStr, rand, doubleRGB, round, sleep } = require('../utils/helpers')
const globalState = require('../utils/globalState')
const { interpolateRgb } = require('d3-interpolate')
const { eventHub } = require('../utils/eventHub')
const { path } = require('ramda')
const { get, set } = require('lodash')
const convertPitchToNote = require('../utils/convertPitchToNote')

/* UTILS */
const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`
const roundRgb = ({ r, g, b }) => ({ r: round(r), g: round(g), b: round(b) })
const getRgb = ({ r, g, b }) => ({ r, g, b })
const changeIntensity = ({ r, g, b }, intensity) => roundRgb({ r: intensity * r, g: intensity * g, b: intensity * b })
const isBusy = id => lights[id].busy


/* State */
const state = {
  lights: {},
  initRan: false,
  isIntro: true
}

let lights = {}
let initRan = false

const getLights = () => Object.assign({}, lights)
const lightLoop = () => Object.keys(getLights())

/* Sweet variables */
const zeroRgb = { r: 0, g: 0, b: 0 }
const white = { r: 255, g: 255, b: 255 }
const maxRed = { r: 240, g: 0, b: 0 }
const maxGreen = { r: 0, g: 255, b: 0 }
const maxBlue = { r: 0, g: 0, b: 255 }
const maxPurple = { r: 255, g: 0, b: 255 }
const halfRed = { r: 50, g: 0, b: 0 }

const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min

const maxOneRGB = () => [maxRed, maxGreen, maxBlue][rand(2)]

if (globalState.currentGroup === null) {
  globalState.currentGroup = {}
  globalState.currentGroup.lights = ['1', '2', '3', '4', '5', '6']
}

const configurateVariables = () => {
  lights = path(['currentGroup', 'lights'], globalState).reduce((acc, id) => {
    acc[id] = { id, ...zeroRgb, busy: false, tones: [], interval: null, busyCount: 0 }
    return acc
  }, {})
}

const emitLights = () => {
  const colorMessage = lightLoop().map(id => {
    const { r, g, b } = changeIntensity(lights[id], 0.7)
    return [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)]
  })

  eventHub.emit('emitLight', colorMessage)
}



const tweenLightTo = (rgb, id, ms = 5000) => {
  // console.log('twening', id, 'to ', rgb, 'from ', getRgb(lights[id]))
  console.log(id)
  console.log(getRgb(lights[id]))
  const currentRgb = getRgbAsString(lights[id])
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = interpolateRgb(currentRgb, destinationRgb)

  let i = 0
  return new Promise((resolve, reject) => {
    const _interval = setInterval(() => {
      if (i > 0.99) {
        const [r, g, b] = getRgbFromCssStr(interpolation(1))
        Object.assign(lights[id], { r, g, b, busy: false })
        clearInterval(_interval)
        resolve()
      }

      i += 20 / ms
      console.log('tweeeening')
      const [r, g, b] = getRgbFromCssStr(interpolation(i))
      Object.assign(lights[id], { r, g, b, busy: true })
    }, 20)
  })
}




// const colorMap = {
//   'C': 'rgb(222, 122, 253)',
//   'C#': 'rgb(159, 54, 191)',
//   'D': 'rgb(88, 247, 221)',
//   'D#': 'rgb(29, 169, 146)',
//   'E': 'rgb(245, 178, 77)',
//   'F': 'rgb(10, 101, 220)',
//   'F#': 'rgb(10, 50, 255)',
//   'G': 'rgb(50, 255, 10)',
//   'G#': 'rgb(30, 230, 20)',
//   'A': 'rgb(90, 180, 190)',
//   'A#': 'rgb(90, 230, 150)',
//   'B': 'rgb(254, 2, 50)'
// }

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

const getNonBusyLight = () => {
  const freeLights = lightLoop().filter(({ busy }) => !busy)
  return freeLights[rand(freeLights.length - 1)]
}





const allMax = () => {
  lightLoop().forEach(id => {
    // !isBusy(id) && Object.assign(lights[id], changeIntensity(maxRed, 0.8))

  })
}

const heartBeatAll = () => {
  lightLoop().forEach(id => {
    heartBeat(id)
  })
}


const removeBusy = () => {
  lightLoop().forEach(id => Object.assign(lights[id], { busy: false }))
}

const getTonesForLight = id => lights[id].tones

const getLightsForTone = tone => {
  let light = null
  lightLoop().forEach(id => {
    const tones = getTonesForLight(id)
    if (tones.includes(tone)) {
      light = lights[id]
    }
  })
  return light
}

const withLeastTones = () => {
  const id = lightLoop().sort((a, b) => lights[a].tones.length - lights[b].tones.length)[0]
  return { id }
}

const assignTone = (id, tone) => {
  id && lights[id].tones.push(tone)
}




const dampenLights = () => {
  const _lights = getLights()
  Object.keys(_lights).forEach(id => {
    const { r, g, b, busy } =  _lights[id]
    busy && console.log('busy', id)
    !busy && Object.assign(lights[id], changeIntensity({ r, g, b }, 0.9))
  })
}


const init = () => {
  configurateVariables()
  initRan = true
  setInterval(() => {
    globalState.hasSocket && emitLights()
    dampenLights()
  }, 50)
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
  if (get(state, 'isIntro')) {
    return
  }

  const { pitches, duration, loudness_start, loudness_max, loudness_max_time } = segment
  const tone = convertPitchToNote(pitches)
  const [r, g, b] = getRgbFromCssStr(colorMap[tone])
  const { id } = getLightsForTone(tone) || withLeastTones()
  !getLightsForTone(tone) && assignTone(id, tone)

  console.log(duration, tone)
  if (globalState.hasSocket) {
    if (lights[id]) {
      duration > 1000
        ? tweenLightTo({ r, g, b }, id, duration)
        : Object.assign(lights[id], { r, g, b })
    }
  }
})

/* Used for timing how long the fade down should be */
eventHub.on('beat', ([beat, index]) => {
  lightLoop().forEach(id => {
    Object.assign(lights[id], changeIntensity(getRgb(lights[id]), 1.3))      
  })  
})


eventHub.on('bar', () => {
  get(state, 'isIntro')
    ? heartBeatAll()
    : removeBusy()
})

eventHub.on('section', ([section, index]) => {
  if(index < 2) {
    set(state, 'isIntro', true)
  }
  else {
    set(state, 'isIntro', false)
  }
  console.log({section})
})



eventHub.on('letsgo', () => {
  // heartBeat(3)
  // infiniteTween([false, true])
})

// const infiniteTween = ([dark, next, count = 0, intervalLength = 2000]) => {
//   const randIntensity = getRandomArbitrary(0.5, 0.8)

//   lightLoop().forEach(id => {
//     dark
//       ? tweenLightTo(changeIntensity(next ? maxRed : maxPurple, randIntensity), id, intervalLength)
//       : tweenLightTo(changeIntensity(!next ? changeIntensity(maxRed, 0.5) : changeIntensity(maxPurple, 0.5), randIntensity), id, intervalLength)
//   })

//   setTimeout(() => {
//     if (count > 3) {
//       intervalLength -= 50
//       if (intervalLength < 0) {
//         intervalLength = 50
//       }
//       count = 0
//     }

//     const nextTween = dark
//       ? [!dark, !next, count + 1, intervalLength]
//       : [!dark, next, count, intervalLength]

//     infiniteTween(nextTween)
//   }, intervalLength + 200)
// }