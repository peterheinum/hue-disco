const convertRgbToBytes = require('../utils/convertRgbToBytes')
const { eventHub } = require('../utils/eventHub')
let state = require('../utils/globalState')

const avg = arr => arr.reduce((acc, cur) => acc += cur, 0) / arr.length

let lastBeat = Date.now()
let distanceBetweenBeats
const lastSegments = []
let currentPitch
let n = false

const emitLight = () => {
  if (!state.currentGroup) {
    return
  }

  const avgLoudnessMaxTime = avg(lastSegments.map(x => x.loudness_max_time))
  const avgDuration = avg(lastSegments.map(x => x.duration))

  const red = avgLoudnessMaxTime < 60 ?
    Math.floor((avgLoudnessMaxTime / 60) * 255) :
    Math.floor(avgLoudnessMaxTime)

  const blue = avgDuration < 255 ?
    Math.floor(avgDuration) :
    255

  n = !n
  const brightness = 255

  const green = ((currentPitch / 12) * 255)

  distanceBetweenBeats = 0 - ((lastBeat - Date.now()) / 2)
  lastBeat = Date.now()


  const { lights } = state.currentGroup
  const values = lights.map((__, index) => {
    return n ?
      index % 2 == 0 ?
      convertRgbToBytes(0, 255, 0) :
      convertRgbToBytes(255, 0, 0) :
      index % 2 != 0 ?
      convertRgbToBytes(0, 255, 0) :
      convertRgbToBytes(255, 0, 0)
  }).reduce((acc, cur, index) => ({...acc, [index]: cur }), {})
  const lightAndColorArray = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...values[index][0], ...values[index][1], brightness, brightness])
  const turnedofLights = lights.map(id => [0x00, 0x00, parseInt(id), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])

  eventHub.emit('emitLight', [...lightAndColorArray])
    // setTimeout(() => eventHub.emit('emitLight', [...turnedofLights]), distanceBetweenBeats)
}

eventHub.on('beat', ([beat, index]) => {
  emitLight()
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