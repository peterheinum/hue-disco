const convertRgbToBytes = require('../utils/convertRgbToBytes')
const { flat, rand, getRgbFromCssStr } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')
const d3 = require('d3-interpolate')
const state = require('../utils/globalState')

const avg = arr => arr.reduce((acc, cur) => acc += cur, 0) / arr.length

const round = number => Math.round(number)
const doubleRGB = (r, g, b) => [round(r), round(r), round(g), round(g), round(b), round(b)]

let lastBeat = Date.now()
let distanceBetweenBeats
const lastSegments = []
let currentPitch
let interval
let n = false

let functionSwitch = null

let interpolation
const randomRgb = () => `rgb(${rand(255)},${rand(100)},${rand(255)})`
let lastRandom = randomRgb()

const startInterpolate = () => {
  // const a = n ? 'rgb(0, 0, 255)' : 'rgb(255, 0, 0)'
  // const b = !n ? 'rgb(0, 0, 255)' : 'rgb(255, 0, 0)'

  let random = randomRgb()
  interpolation = d3.interpolateRgb(lastRandom, random)
  lastRandom = random
}

eventHub.on('testFunction', () => {
  tweenAround()
})

const tweenAround = () => {
  n = !n
  clearInterval(interval)
  startInterpolate()

  let i = 0
  interval = setInterval(() => {
    if (i > 0.99) {
      return
    }

    i += 0.05
    const [r, g, b] = getRgbFromCssStr(interpolation(i))
    emitRgb(r, g, b)
  }, 50)
}

const emitRgb = (r, g, b, array = []) => {
  const { lights } = state.currentGroup
  const colorMessage =
    array.length ?
    array.map(([id, ...rgb]) => [0x00, 0x00, parseInt(id), ...doubleRGB(...rgb)]) :
    lights.map(id => [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)])
  console.log(colorMessage)
  eventHub.emit('emitLight', colorMessage)
}


const switchAndBlink = () => {
  n = !n

  const { lights } = state.currentGroup
  if (count % 2 == 0) {
    const lightArray = lights.map((id, index) => ([id, index % 2 == 0 ? n ? doubleRGB(255, 0, 0) : doubleRGB(0, 0, 255) : !n ? doubleRGB(255, 0, 0) : doubleRGB(0, 0, 255)]))
    console.log('SWITCH 2')
    emitRgb(null, null, null, lightArray)
  }

  if (count % 2 == 1) {
    const lightArray = lights.map((id, index) => ([id, index % 2 == 0 ? n ? doubleRGB(0, 255, 0) : doubleRGB(0, 0, 255) : !n ? doubleRGB(0, 255, 0) : doubleRGB(0, 0, 255)]))
    console.log('SWITCH 4')
    emitRgb(null, null, null, lightArray)
  }
}

const hardBlink = () => {
  n = !n

  const avgLoudnessMaxTime = avg(lastSegments.map(x => x.loudness_max_time))
  const avgDuration = avg(lastSegments.map(x => x.duration))

  const red = avgLoudnessMaxTime < 60 ?
    Math.floor((avgLoudnessMaxTime / 60) * 255) :
    Math.floor(avgLoudnessMaxTime)

  const blue = avgDuration < 300 ?
    Math.floor(avgDuration) :
    avgDuration / 2 > 150 ?
    avgDuration / 4 :
    avgDuration / 2

  const green = ((currentPitch / 12) * 255)

  emitRgb(red, green, blue)
  console.log('hardblink')
  console.log(red, green, blue)
    // setTimeout(() => emitRgb(0, 0, 0), )
}

const lightEffects = [tweenAround, hardBlink]

const getCurrentFunction = () => lightEffects[functionSwitch]
let count = 0
eventHub.on('beat', ([beat, index]) => {
  count++

  if (count % 4 != 0 || !state.currentGroup) {
    return
  }

  distanceBetweenBeats = 0 - ((lastBeat - Date.now()) / 2)
  lastBeat = Date.now()
  console.log(getCurrentFunction())
  getCurrentFunction()()
})

eventHub.on('section', () => {
  functionSwitch = rand(lightEffects.length)
  console.log({ functionSwitch })
})

//Bar is the first beat
eventHub.on('bar', () => {

})

const addToPile = segment => {
  lastSegments.length > 2 && lastSegments.pop()
  const { loudness_max_time, duration, pitches } = segment
  currentPitch = pitches.indexOf(Math.max(...pitches))
  lastSegments.push({ loudness_max_time, duration })
}

eventHub.on('segment', ([segment, index]) => {
  addToPile(segment)
})