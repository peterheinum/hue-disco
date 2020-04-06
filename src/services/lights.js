const { getRgbFromCssStr, rand, doubleRGB } = require('../utils/helpers')
const globalState = require('../utils/globalState')
const { interpolateRgb } = require('d3-interpolate')
const { eventHub } = require('../utils/eventHub')
const convertRgbToBytes = require('../utils/convertRgbToBytes')
const convertPitchToNote = require('../utils/convertPitchToNote')
const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`

let lights = {}
let initRan = false


const zeroRgb = () => ({ r: 0, g: 0, b: 0 })
const white = () => ({  r: 255, g: 255, b: 255 })
const maxRed = {  r: 255, g: 0, b: 0 }
const maxGreen = {  r: 0, g: 255, b: 0 }
const maxBlue = {  r: 0, g: 0, b: 255 }

const maxOneRGB = () => {
  return [maxRed, maxGreen, maxBlue][rand(2)]
}

const changeIntensity = ({r, g, b}, intensity) => ({ r: intensity * r, g: intensity * g, b: intensity * b })
const isBusy = id => lights[id].busy

if (globalState.currentGroup === null) {
  globalState.currentGroup = {}
  globalState.currentGroup.lights = ['1', '2', '3', '4', '5', '6']
}

const populateLights = () => {
  lights = globalState.currentGroup.lights.reduce((acc, id) => {
    acc[id] = { id, ...zeroRgb(), busy: false, tones: [], interval: null, busyCount: 0 }
    return acc
  }, {})
}

const tweenLightTo = (rgb, id, ms = 5000) => {
  if(isBusy(id)) return
  console.log(id, 'tweening to ', rgb)
  const currentRgb = getRgbAsString(lights[id])
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = interpolateRgb(currentRgb, destinationRgb)

  let i = 0
  lights[id].interval = setInterval(() => {
    if (i > 0.99) {
      const [r, g, b] = getRgbFromCssStr(interpolation(1))
      clearInterval(lights[id].interval)
      Object.assign(lights[id], { r, g, b, busy: false })
      console.log(lights[id])
    }

    i += 20 / ms
    const [r, g, b] = getRgbFromCssStr(interpolation(i))
    Object.assign(lights[id], { r, g, b, busy: true })
  }, 20)

}

const init = () => {
  populateLights()
  initRan = true
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
  const freeLights = Object.keys(lights).filter(key => !lights[key].busy)
  return freeLights[rand(freeLights.length - 1)]
}


/* Used for timing how long the fade down should be */ 
eventHub.on('beat', () => {
  Object.keys(lights).forEach(key => {
    // Object.assign(lights[key], changeIntensity(maxBlue, 0.4))      
  })  
})



const allMax = () => {
  Object.keys(lights).forEach(id => {
    !isBusy(id) && Object.assign(lights[id], changeIntensity(maxRed, 0.8))
  })
}

eventHub.on('bar', () => {
  allMax()
})

const getTonesForLight = id => lights[id].tones

const getLightsForTone = tone => {
  let light = null
  Object.keys(lights).forEach(id => {
    const tones = getTonesForLight(id)
    if (tones.includes(tone)) {
      light = lights[id]
    }
  })
  return light
}

const withLeastTones = () => {
  const id = Object.keys(lights).sort((a, b) => lights[a].tones.length - lights[b].tones.length)[0]
  return { id }
}

const assignTone = (id, tone) => { 
  id && lights[id].tones.push(tone)
}

eventHub.on('segment', ([segment, index]) => {
  if (!initRan) {
    init()
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


const emitLights = () => {
  const colorMessage = Object.keys(lights).map(id => {
    const { r, g, b } = lights[id]
    return [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)]
  })

  eventHub.emit('emitLight', colorMessage)
}

const increaseBusyCount = id => {
  lights[id].busyCount++
  if(lights[id].busyCount > 20) {
    lights[id].busyCount = 0
    lights[id].busy = false
  }
}

const dampenLights = () => {
  Object.keys(lights).forEach(id => {
    const { r, g, b, busy } = lights[id]
    busy && increaseBusyCount(id)
    !busy && Object.assign(lights[id], changeIntensity({ r, g, b }, 0.9))
  })
}

setInterval(() => {
  globalState.hasSocket && emitLights()
  dampenLights()
}, 50)

init()

















/* ATTEMPT TO GROUP THE ATTACKS INTO DIFFERENT GROUPS AND MAKE INTENSITY BASED ON THE ATTACK OF THE SOUND */ 
// const intensity = groupAttack(loudness_max * loudness_max_time)
// Object.assign(lights[id], withIntensity({ r, g, b }, intensity))

// const attackRanges = []
// //TODO, TRY LIGHTS WITH THE INTENSITY BEING THE GROUP, THE LESSER GROUP THE MORE INTENSE ? 
// const sortedRanges = []

// const isInBetween = (top, low, value) => value > low && value < top

// const placeAttack = number => {
//   for (let i = 0; i < sortedRanges.length; i++) {
//     const [lowTop] = sortedRanges[i]
//     const { low, top } = lowTop
//     if(isInBetween(low, top, number)) {
//       console.log(i)
//       break
//     }
//   }

//   for (let i = 0; i < sortedRanges.length; i++) {
//     const [lowTop] = sortedRanges[i]
//     const { low, top } = lowTop
//     if(isInBetween(low, top, number)) {
//       sortedRanges[i][1].push(number)
//       return i
//     }
//   }
// }

// const groupAttack = number => {
//   attackRanges.push(number)
//   const ranges = Object.keys(lights).length
//   if(attackRanges.length === 40) {
//     const max = Math.min(...attackRanges)

//     const oneRange = max/ranges

//     for (let i = 1; i < ranges + 1; i++) {
//       const low = oneRange * i
//       const top = oneRange * 2 * i
//       const rangeCondition = { low, top }
//       sortedRanges.push([ rangeCondition, [] ])
//     }
//   }

//   if(sortedRanges.length) {
//     const intensity = 1 - placeAttack(number)/ranges
//     return intensity
//   }
// }

// const withIntensity = ({r, g, b}, intensity) => ({ r: intensity * r, g: intensity * g, b: intensity * b })
