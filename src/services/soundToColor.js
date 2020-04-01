require('dotenv').config({ path: __dirname + '../../.env' })
if (process.env.HUE_HUB == undefined) {
  const fixEnv = async () => {
    await require('../utils/fixEnv')()
  }

  fixEnv()
}
const convertRgbToBytes = require('../utils/convertRgbToBytes')
const { flat, rand, getRgbFromCssStr, avg } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')
const d3 = require('d3-interpolate')
const globalState = require('../utils/globalState')
const convertPitchToNote = require('../utils/convertPitchToNote')

const state = {
  r: 255,
  g: 0,
  b: 0,
}



const round = number => Math.round(number)
const doubleRGB = (r, g, b) => [round(r), round(r), round(g), round(g), round(b), round(b)]

let lastBeat = Date.now()
let distanceBetweenBeats
const lastSegments = []
let currentPitch
let n = false

const randomRgb = () => `rgb(${rand(255)},${rand(100)},${rand(255)})`

eventHub.on('testFunction', () => {

})


const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`

const tweenStateTo = (rgb, ms = 500) => {
  const stateRgb = getRgbAsString(state)
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = d3.interpolateRgb(stateRgb, destinationRgb)

  let i = 0
  let interval = setInterval(() => {
    if (i > 0.99) {
      console.log('finish')
      const [r, g, b] = getRgbFromCssStr(interpolation(1))
      Object.assign(state, { r, g, b })
      clearInterval(interval)
    }

    i += 50 / ms
    const [r, g, b] = getRgbFromCssStr(interpolation(i))
    console.log(r, g, b)
    emitRgb(r, g, b)
  }, 50)
}

// const { getGroups} = require('../utils/groupHandler')
// getGroups().then(async groups => {
//   const { startStream, stopStream } = require('./socket')
//   console.log(groups)
//   globalState.currentGroup = groups[0]
//   for (let i = 0; i < groups.length; i++) {
//     await stopStream(groups[i].id)
//   }

//   console.log(globalState.currentGroup)

//   // await startStream(globalState.currentGroup)
//   // setTimeout(() => {
//   //   tweenStateTo({ r: 0, g: 0, b: 255 }, 10000)
//   // }, 50);
// })




const emitRgb = (r, g, b, array = []) => {
  const { lights } = globalState.currentGroup
  const colorMessage =
    array.length ?
      array.map(([id, ...rgb]) => [0x00, 0x00, parseInt(id), ...doubleRGB(...rgb)]) :
      lights.map(id => [0x00, 0x00, parseInt(id), ...doubleRGB(r, g, b)])
  eventHub.emit('emitLight', colorMessage)
}


const switchAndBlink = () => {
  n = !n

  const { lights } = globalState.currentGroup
  if (count % 2 == 0) {
    const lightArray = lights.map((id, index) => ([id,
      index % 2 == 0
        ? n
          ? doubleRGB(255, 0, 0)
          : doubleRGB(0, 255, 0)
        : !n
          ? doubleRGB(255, 0, 0)
          : doubleRGB(0, 255, 0)])).map(flat)

    emitRgb(null, null, null, lightArray)
  }

  if (count % 2 == 1) {
    const lightArray = lights.map((id, index) => ([id, index % 2 == 0 ? n ? doubleRGB(0, 255, 0) : doubleRGB(0, 0, 255) : !n ? doubleRGB(0, 255, 0) : doubleRGB(0, 0, 255)])).map(flat)
    emitRgb(null, null, null, lightArray)
  }
}

const hardBlink = () => {
  n = !n

  const avgLoudnessMaxTime = avg(lastSegments.map(x => x.loudness_max_time))
  const avgDuration = avg(lastSegments.map(x => x.duration))

  const red = avgLoudnessMaxTime < 60
    ? Math.floor((avgLoudnessMaxTime / 60) * 255)
    : Math.floor(avgLoudnessMaxTime)

  const blue = avgDuration < 300 ?
    Math.floor(avgDuration) :
    avgDuration / 2 > 150 ?
      avgDuration / 4 :
      avgDuration / 2

  const green = ((currentPitch / 12) * 255)

  emitRgb(red, green, blue)

  setTimeout(() => emitRgb(0, 0, 0), distanceBetweenBeats)
}

let count = 0
let currentRgb = {
  r: 255,
  g: 0,
  b: 0
}

eventHub.on('beat', ([beat, index]) => {
  count++
  if (count % 2 != 0 || !globalState.currentGroup) {
    return
  }

  distanceBetweenBeats = 0 - ((lastBeat - Date.now()) / 2)
  lastBeat = Date.now()
  switchAndBlink()
  // tweenStateTo(currentRgb, distanceBetweenBeats/2)
})

eventHub.on('section', () => {

})

//Bar is the first beat
eventHub.on('bar', () => {

})

// const addToPile = segment => {
//   lastSegments.length > 2 && lastSegments.pop()
//   const { loudness_max_time, duration, pitches } = segment
//   currentPitch = pitches.indexOf(Math.max(...pitches))
//   lastSegments.push({ loudness_max_time, duration })
// }

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
let distanceBetweenSegments
let lastSegmentTimeStamp

const newTone = (rgb) => JSON.stringify(rgb) !== JSON.stringify(currentRgb)


eventHub.on('segment', ([segment, index]) => {
  distanceBetweenSegments = 0 - ((lastSegmentTimeStamp - Date.now()) / 2)
  lastSegmentTimeStamp = Date.now()
  console.log(segment)
  const { pitches, duration, loudness_max_time } = segment
  // if (loudness_max_time > 70) {
    // console.log(segment)
    const [r, g, b] = getRgbFromCssStr(colorMap[convertPitchToNote(pitches)])
    if (globalState.currentGroup && newTone({ r, g, b })) {
      Object.assign(currentRgb, { r, g, b })
      // emitRgb(r, g, b)
      // tweenStateTo(currentRgb, distanceBetweenSegments)
    }
  // }
})
