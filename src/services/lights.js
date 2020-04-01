const { getRgbFromCssStr } = require('../utils/helpers')
const globalState = require('../utils/globalState')
const { interpolateRgb } = require('d3-interpolate')

let lights = {}

const zeroRgb = () => ({ r: 0, g: 0, b: 0 })

globalState.currentGroup = {}
globalState.currentGroup.lights = ['1', '2', '3', '4', '5','6']

const populateLights = () => {
  lights = globalState.currentGroup.lights.reduce((acc, id) => {
    acc[id] = { ...zeroRgb(), assigns: [] }
    return acc
  }, {})
}

const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`



const tweenLightTo = (rgb, id, ms = 500) => {
  const currentRgb = getRgbAsString(lights[id])
  const destinationRgb = getRgbAsString(rgb)
  const interpolation = interpolateRgb(currentRgb, destinationRgb)

  let i = 0
  let interval = setInterval(() => {
    if (i > 0.99) {
      console.log('finish')
      const [r, g, b] = getRgbFromCssStr(interpolation(1))
      Object.assign(lights[id], { r, g, b })
      console.log(lights)
      clearInterval(interval)
    }

    i += 50 / ms
    const [r, g, b] = getRgbFromCssStr(interpolation(i))
    console.log(r, g, b)
  }, 50)
}

const init = () => {
  populateLights()
  tweenLightTo({ r: 255, g: 125, b: 50 }, 2)
  tweenLightTo({ r: 255, g: 125, b: 50 }, 5)
  tweenLightTo({ r: 255, g: 125, b: 50 }, 6)
  
}

init()