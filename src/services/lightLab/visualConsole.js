const {eventHub} = require("../../utils/eventHub")

const log = (...obj) => console.log(...obj)
const clear = () => console.clear()

const volumeOf = (type) => (obj) => Math.round(obj[type] / getNumForType(type) * 25)  

const getNumForType = (type) => ({ duration: 1000, loudness_max_time: 250, loudness_max: -20 }[type])
const getWavesFrom = (type) => (obj) => (char) => Array(volumeOf(type)(obj))
  .fill(char)
  .join('')

const getVolumeOfSegment = (arg) => volumeOf('loudness_max')(arg) + volumeOf('loudness_max_time')(arg)

const beat = ([arg]) => {
  // log(getWavesFrom('duration')(arg)('-'))
  log('\n')
}

eventHub.on('beat', beat)

const chunkArray = (arr,n) => {
  const chunkLength = Math.round(arr.length/2)
  return [arr.slice(0, chunkLength), arr.slice(chunkLength, arr.length)]
}

const segment = ([arg]) => {
  const loudness_max = getWavesFrom('loudness_max')(arg)('|')
  const loudness_max_time = getWavesFrom('loudness_max_time')(arg)('~')
  const [start, finish] = chunkArray(loudness_max_time, 2)
  const str = getVolumeOfSegment(arg) + '  ' +  start + loudness_max + finish
  // log(getVolumeOfSegment(arg))
  log(str)
}

eventHub.on('segment', segment)

const section = ([arg]) => {
  log('section',arg)
}

// eventHub.on('section', section)
let i = 0
const bar = ([arg]) => {
  i++
  if (i % 2 == 0) {
    // clear()
  }
}

eventHub.on('bar', bar)

module.exports = {
  getVolumeOfSegment
}