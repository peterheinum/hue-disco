const { eventHub } = require('../../utils/eventHub')
const { getRgbFromCssStr, int } = require('../../utils/helpers')
const { lightLoop, emitLights, setLight, changeIntensity, dampenLights } = require('./lights')

const keyboardConfig = {
  'Q': 'rgb(255, 0, 0)',
  'W': 'rgb(245, 0, 0)',
  'E': 'rgb(235, 0, 0)',
  'R': 'rgb(225, 0, 0)',
  'T': 'rgb(215, 0, 0)',
  'Y': 'rgb(155, 0, 0)',
  'U': 'rgb(145, 0, 0)',
  'I': 'rgb(135, 0, 0)',
  'O': 'rgb(125, 0, 0)',
  'P': 'rgb(115, 0, 0)',
  'Å': 'rgb(105, 0, 0)',

  'A': 'rgb(0, 255, 0)',
  'S': 'rgb(0, 245, 0)',
  'D': 'rgb(0, 235, 0)',
  'F': 'rgb(0, 225, 0)',
  'G': 'rgb(0, 215, 0)',
  'H': 'rgb(0, 205, 0)',
  'K': 'rgb(0, 155, 0)',
  'J': 'rgb(0, 145, 0)',
  'L': 'rgb(0, 135, 0)',
  'Ä': 'rgb(0, 125, 0)',
  'Ö': 'rgb(0, 115, 0)',

  '<': 'rgb(0, 0, 255)',
  'Z': 'rgb(0, 0, 245)',
  'X': 'rgb(0, 0, 235)',
  'C': 'rgb(0, 0, 215)',
  'V': 'rgb(0, 0, 195)',
  'B': 'rgb(0, 0, 155)',
  'M': 'rgb(0, 0, 145)',
  'N': 'rgb(0, 0, 135)',
  ',': 'rgb(0, 0, 125)',
  '.': 'rgb(0, 0, 115)',
  '-': 'rgb(0, 0, 105)',

  // ' ': 'heartBeatAll()'
}

const mapKey = key => keyboardConfig[key.toUpperCase()]

const truthy = val => val

const getCommands = keys => keys.map(mapKey).filter(truthy)

const combineRgbs = (commands) => {
  const rgbs = commands.map(getRgbFromCssStr)
  const sumRgbs = (acc, nums) => acc.map((sum, i) => sum + int(nums[i]))

  const [r, g, b] = rgbs.reduce(sumRgbs, [0, 0, 0]).map(num => num / rgbs.length)
  console.log(r, g, b)
  return { r, g, b }
}


eventHub.on('keyboard', keys => {
  // !intervalActive && startInterval()
  if(keys.includes(' ')) {
    stopInterval()
  }
  const commands = getCommands(keys)
  console.log(commands)
  if (commands.length > 1) {
    const rgb = combineRgbs(commands)
    lightLoop().forEach(id => setLight(id, { ...rgb }))
  }

  if (commands.length === 1) {
    const [command] = commands

    if (command.includes('rgb')) {
      const [r, g, b] = getRgbFromCssStr(command)
      lightLoop().forEach(id => setLight(id, { r, g, b, capacity: 100 }))
    }
  }
  emitLights()
})