const { eventHub } = require('../utils/eventHub')
let state = require('../utils/globalState')

const avg = arr => arr.reduce((acc, cur) => acc += cur, 0) / arr.length

let interval
const lastSegments = []
let n = false

eventHub.on('beat', ([beat, index]) => {
  const avgLoudnessMaxTime = avg(lastSegments.map(x => x.loudness_max_time))
  const avgDuration = avg(lastSegments.map(x => x.duration))

  const red = avgLoudnessMaxTime < 60
    ? Math.floor((avgLoudnessMaxTime / 60) * 255)
    : Math.floor(avgLoudnessMaxTime)
  
  const blue = avgDuration < 255
    ? Math.floor(avgDuration)
    : 255

  global.r = n ? red : 255-red
  global.g = n ? 255-red : red
  global.b = n ? blue : 255-blue
  n = !n
  eventHub.emit('emitLight')
})

const addToPile = segment => {
  lastSegments.length > 5 && lastSegments.pop()
  const { loudness_max_time, duration } = segment
  console.log(segment)
  lastSegments.push({ loudness_max_time, duration })
}

eventHub.on('segment', ([segment, index]) => {
  addToPile(segment)
})
