const convertRgbToBytes = require('../utils/convertRgbToBytes')
const { flat, rand, getRgbFromCssStr } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')
const d3 = require('d3-interpolate')
const state = require('../utils/globalState')

const avg = arr => arr.reduce((acc, cur) => acc += cur, 0) / arr.length

let lastBeat = Date.now()
let distanceBetweenBeats
const lastSegments = []
let currentPitch
let interval
let n = false

let functionSwitch = false

let interpolation
const startInterpolate = () => {
  const randomRgb = () => `rgb(${rand(255)},${rand(255)},${rand(255)})`
  interpolation = d3.interpolateCubehelix(randomRgb(), randomRgb())
}

const tweenAround = () => {
  clearInterval(interval)
  distanceBetweenBeats = 0 - ((lastBeat - Date.now()) / 2)
  lastBeat = Date.now()
  startInterpolate()

  let i = 0
  interval = setInterval(() => {
    i += 0.1
    const [r, g, b] = getRgbFromCssStr(interpolation(i))
    emitRgb(r, g, b)
    console.log(r, g, b)
  }, 400)
}

const emitRgb = (r, g, b, brightness = 200) => {
  const { lights } = state.currentGroup
  const values = lights.map(() => convertRgbToBytes(r, g, b)).reduce((acc, cur, index) => ({ ...acc, [index]: cur }), {})
  const colorMessage = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...flat(values[index]), brightness, brightness])

  eventHub.emit('emitLight', colorMessage)
}


const hardBlink = () => {
  if (!state.currentGroup) {
    return
  }

  n = !n

  const avgLoudnessMaxTime = avg(lastSegments.map(x => x.loudness_max_time))
  const avgDuration = avg(lastSegments.map(x => x.duration))

  const red = avgLoudnessMaxTime < 60 ?
    Math.floor((avgLoudnessMaxTime / 60) * 255) :
    Math.floor(avgLoudnessMaxTime)

  const blue = avgDuration < 300
    ? Math.floor(avgDuration)
    : avgDuration / 2 > 150
      ? avgDuration / 4
      : avgDuration / 2

  const brightness = n ? 200 : 100

  const green = ((currentPitch / 12) * 255)

  distanceBetweenBeats = 0 - ((lastBeat - Date.now()) / 2)
  lastBeat = Date.now()


  const { lights } = state.currentGroup
  const values = lights.map(() => convertRgbToBytes(red, green, blue)).reduce((acc, cur, index) => ({ ...acc, [index]: cur }), {})
  const lightAndColorArray = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...flat(values[index]), brightness, brightness])
  const turnedofLights = lights.map(id => [0x00, 0x00, parseInt(id), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])


  eventHub.emit('emitLight', lightAndColorArray)
  setTimeout(() => eventHub.emit('emitLight', turnedofLights), distanceBetweenBeats)
}

const switchAndBlink = () => {
  if (!state.currentGroup) {
    return
  }

  n = !n
  const brightness = 255


  const { lights } = state.currentGroup
  const values = lights.map((__, index) =>
    n ?
      index % 2 == 0 ?
        convertRgbToBytes(0, 255, 0) :
        convertRgbToBytes(255, 0, 0) :
      index % 2 != 0 ?
        convertRgbToBytes(0, 255, 0) :
        convertRgbToBytes(255, 0, 0)
  ).reduce((acc, cur, index) => ({ ...acc, [index]: cur }), {})
  const lightAndColorArray = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...flat(values[index]), brightness, brightness])

  eventHub.emit('emitLight', lightAndColorArray)
}

const getCurrentFunction = () => functionSwitch
  ? hardBlink
  : switchAndBlink


eventHub.on('beat', ([beat, index]) => {
  distanceBetweenBeats = 0 - ((lastBeat - Date.now()) / 2)
  lastBeat = Date.now()

  // getCurrentFunction()()
})

eventHub.on('section', () => {
  if(state.currentGroup) {
    functionSwitch = !functionSwitch
    tweenAround()
  }
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