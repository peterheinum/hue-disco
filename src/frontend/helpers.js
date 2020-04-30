const getRgbFromCssStr = str => str.split('rgb(')[1].split(')')[0].split(',')

const int = num => parseInt(num)

const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`
const round = num => Math.round(num)
const roundRgb = ({ r, g, b }) => ({ r: round(r), g: round(g), b: round(b) })


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
}

const mapKey = key => keyboardConfig[key.toUpperCase()]

const truthy = val => val

const getRgbs = keys => keys.map(mapKey).filter(truthy)

const combineRgbs = (commands) => {
  const rgbs = commands.map(getRgbFromCssStr)
  const sumRgbs = (acc, nums) => acc.map((sum, i) => sum + int(nums[i]))

  const [r, g, b] = rgbs.reduce(sumRgbs, [0, 0, 0]).map(num => num / rgbs.length)
  return { r, g, b }
}

export const getColorForCombination = keys => {
  const rgbs = getRgbs(keys)
  const rgb = combineRgbs(rgbs)
  return getRgbAsString(roundRgb(rgb))
}

const filterInt = str => parseInt(str).toString() != 'NaN'
export const filterInts = arr => arr.filter(filterInt)

export const sortMessage = message => {
  const ints = message.filter(filterInt)
  const chars = message.filter(obj => !ints.includes(obj) && obj.length === 1)
  const switches = message.filter(obj => obj === ' ' || !ints.includes(obj) && !chars.includes(obj))
  
  return { ints, chars, switches }
}

