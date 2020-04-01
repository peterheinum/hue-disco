const { getRgbFromCssStr, rand, doubleRGB } = require('../utils/helpers')
const globalState = require('../utils/globalState')
const { interpolateRgb } = require('d3-interpolate')
const { eventHub } = require('../utils/eventHub')
const convertRgbToBytes = require('../utils/convertRgbToBytes')
const convertPitchToNote = require('../utils/convertPitchToNote')
const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`

let lights = {}

const zeroRgb = () => ({ r: 0, g: 0, b: 0 })

if (globalState.currentGroup === null) {
  globalState.currentGroup = {}
  globalState.currentGroup.lights = ['1', '2', '3', '4', '5', '6']
}

const populateLights = () => {
  lights = globalState.currentGroup.lights.reduce((acc, id) => {
    acc[id] = { ...zeroRgb(), busy: false }
    return acc
  }, {})
}




const tweenLightTo = (rgb, id, ms = 5000) => {
  const currentRgb = getRgbAsString(lights[id])
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = interpolateRgb(currentRgb, destinationRgb)

  let i = 0
  let interval = setInterval(() => {
    if (i > 0.99) {
      const [r, g, b] = getRgbFromCssStr(interpolation(1))
      Object.assign(lights[id], { r, g, b, busy: false })
      clearInterval(interval)
    }

    i += 20 / ms
    const [r, g, b] = getRgbFromCssStr(interpolation(i))
    Object.assign(lights[id], { r, g, b, busy: true })
  }, 20)
}

const init = () => {
  populateLights()
  // tweenLightTo({ r: 255, g: 125, b: 50 }, 2)
  // tweenLightTo({ r: 255, g: 125, b: 50 }, 5)
  // tweenLightTo({ r: 255, g: 125, b: 50 }, 6)
}

const colorMap = {
  'C': 'rgb(222, 122, 253)',
  'C#': 'rgb(159, 54, 191)',
  'D': 'rgb(88, 247, 221)',
  'D#': 'rgb(29, 169, 146)',
  'E': 'rgb(245, 178, 77)',
  'F': 'rgb(10, 101, 220)',
  'F#': 'rgb(10, 50, 255)',
  'G': 'rgb(50, 255, 10)',
  'G#': 'rgb(30, 230, 20)',
  'A': 'rgb(90, 180, 190)',
  'A#': 'rgb(90, 230, 150)',
  'B': 'rgb(229, 229, 229)'
}

const getNonBusyLight = () => {
  const freeLights = Object.keys(lights).filter(({ busy }) => !busy)
  return freeLights[rand(freeLights.length - 1)]
}

eventHub.on('beat', () => {
  let randomLight = getNonBusyLight()
  if (randomLight) {
    tweenLightTo({ r: 0, g: 1, b: 1 }, randomLight, 2000)
  }
})

eventHub.on('segment', ([segment, index]) => {
  const { pitches, duration, loudness_start, loudness_max, loudness_max_time } = segment

  const [r, g, b] = getRgbFromCssStr(colorMap[convertPitchToNote(pitches)])
  if (globalState.currentGroup) {
    let randomLight = getNonBusyLight()
    if (lights[randomLight]) {
      Object.assign(lights[randomLight], { r, g, b })
      // tweenLightTo({ r, g, b }, randomLight, 500)
    }
  }
})


const emitLights = () => {
  const colorMessage = Object.keys(lights).map(id => {
    const { r, g, b } = lights[id]
    console.log(r, g, b)
    return [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)]
  })

  eventHub.emit('emitLight', colorMessage)
}

setInterval(() => {
  globalState.hasSocket && emitLights()
}, 50)

init()