const { eventHub } = require('../utils/eventHub')
let state = require('../utils/globalState')

const avg = arr => arr.reduce((acc, cur) => acc += cur, 0) / arr.length

let interval
const lastSegments = []
let n = false

eventHub.on('beat', ([beat, index]) => {
  const int = avg(lastSegments.map(x => x.loudness_max_time))
  const color = int < 60
    ? Math.floor((int / 60) * 255)
    : Math.floor(int)
  global.r = n ? color : 255-color
  global.g = n ? color : 255-color
  global.b = n ? color : 255-color
  n = !n
  console.log(state)
})

const addToPile = segment => {
  lastSegments.length > 5 && lastSegments.pop()
  const { loudness_max_time, duration } = segment
  lastSegments.push({ loudness_max_time, duration })
}

eventHub.on('segment', ([segment, index]) => {
  addToPile(segment)
})
