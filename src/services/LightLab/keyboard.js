const state = require('../../stores/globalState')
const { set, get, flow } = require('lodash')
const { eventHub } = require('../../utils/eventHub')
const { getRgbFromCssStr, int, sleep } = require('../../utils/helpers')
const keyboardConfig = require('../../utils/keyboardColorConfig')
const { lightLoop, emitLights, setLight, changeIntensity, dampenLights, zeroRgb, tweenLightTo } = require('./lights')

const truthy = val => val

const currentFunctions = ['flashes']

const getFromKeyConf = key => keyboardConfig[key.toUpperCase()]
const getColors = keys => keys.map(getFromKeyConf).filter(truthy)

const combineRgbs = colors => {
  const rgbs = colors.map(getRgbFromCssStr)
  const sumRgbs = (acc, nums) => acc.map((sum, i) => sum + int(nums[i]))

  const [r, g, b] = rgbs.reduce(sumRgbs, [0, 0, 0]).map(num => num / rgbs.length)
  return { r, g, b }
}

const notIncludedInLockedLights = light => !state.lockedLights.includes(light)
const filterLockedLights = lights => lights.filter(notIncludedInLockedLights)

eventHub.on('activeLights', lights => set(state, 'activeLights', filterLockedLights(lights)))

const functions = {
  'SHIFT': 'tweenSlow',
  'CONTROL': 'tweenFast',
  'ALT': 'repeat',
  ' ': 'flashes'
}

const durations = {
  'tweenSlow': 2000,
  'tweenFast': 1000,
}


const getDuration = () => currentFunctions.map(fn => durations[fn]).filter(truthy)

const repeatFunction = (fn, count = 10) => {
  const repeat = repeatFunction(fn, count - 1)
  if(count < 0) fn().then(repeat)
}

const getFromFns = fn => functions[fn.toUpperCase()]
const getFns = fns => fns.map(getFromFns).filter(truthy)

eventHub.on('setKeyboardFunction', fns => {
  const functions = getFns(fns)
  currentFunctions.splice(0, currentFunctions.length, ...functions)
  console.log(currentFunctions, ' fns')
})

const resetFunction = () => currentFunctions.splice(0, currentFunctions.length, 'flashes')

const cssToRgbObj = ([r, g, b]) => ({ r, g, b })

const setLockedLights = lights => {
  state.lockedLights.splice(0, state.lockedLights.length, ...lights)
}

const setActiveLights = lights => {
  state.activeLights.splice(0, state.activeLights.length, ...lights)
}

const resetLockedLights = () => setLockedLights([])

const lockLights = (lights, duration) => {
  setActiveLights([])
  setLockedLights(lights)
  sleep(duration).then(resetLockedLights)
}

eventHub.on('keyboard', keys => {
  const colors = getColors(keys)
  
  const { activeLights } = state
  const combineAndUpValues = flow([combineRgbs, args => changeIntensity(args, 1.5)])
  const rgb = colors.length > 1 ? combineAndUpValues(colors) : cssToRgbObj(getRgbFromCssStr(colors[0]))
  if (!rgb) return


  if (currentFunctions.includes('flashes')) {
    activeLights.forEach(id => setLight(id, rgb))
    return
  }

  if (currentFunctions.includes('tweenSlow')) {
    const duration = getDuration()
    activeLights.forEach(id => tweenLightTo(rgb, id, duration))
    lockLights(activeLights, duration)
    resetFunction()
    return
  }
  
  if (currentFunctions.includes('tweenFast')) {
    activeLights.forEach(id => tweenLightTo(rgb, id, duration))
    resetFunction()
    return
  }
})