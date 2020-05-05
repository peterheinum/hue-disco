const state = require('../../stores/globalState')
const { set, get, flow } = require('lodash')
const { eventHub } = require('../../utils/eventHub')
const { getRgbFromCssStr, int, sleep, flat } = require('../../utils/helpers')
const keyboardConfig = require('../../utils/keyboardColorConfig')
const { lightLoop, emitLights, setLight, changeIntensity, dampenLights, zeroRgb, tweenLightTo } = require('./lights')

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

const currentFunctions = ['flashes']


const truthy = val => val

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



const getDuration = () => currentFunctions.map(fn => durations[fn]).filter(truthy)

const getFromFns = fn => functions[fn.toUpperCase()]

const getFns = fns => fns.map(getFromFns).filter(truthy)

const setCurrentFunction = functions => currentFunctions.splice(0, currentFunctions.length, ...functions)

const resetFunction = () => currentFunctions.splice(0, currentFunctions.length, 'flashes')

const arrayRgbToObjRgb = ([r, g, b]) => ({ r, g, b })

const cssToRgbObj = flow([getRgbFromCssStr, arrayRgbToObjRgb])

const setLockedLights = lights => {
  state.lockedLights.splice(0, state.lockedLights.length, ...lights)
}

const setActiveLights = lights => {
  state.activeLights.splice(0, state.activeLights.length, ...lights)
}

eventHub.on('activeLights', lights => set(state, 'activeLights', filterLockedLights(lights)))

const callStack = ([fn, ...rest]) => fn().then(() => rest.length && callStack(rest))

// eventHub.on('setKeyboardFunction', fns => {
//   flow([getFns, setCurrentFunction])(fns)
// })


const resetLockedLights = () => setLockedLights([])

const lockLights = (lights, duration) => {
  if (!lights.length) return
  const _lights = [...lights]
  setLockedLights([...lights])
  setActiveLights([])

  sleep(duration).then(resetLockedLights)
  sleep(duration).then(() => setActiveLights(_lights))
}

const sortCases = keys => {
  const upperCase = keys.filter(key => key.toUpperCase() === key)
  const lowerCase = keys.filter(key => key.toLowerCase() === key)
  return { upperCase, lowerCase }
}

const createOneTween = (lights, rgb, duration) => ([
  () => Promise.all(lights.map(id => tweenLightTo(rgb, id, duration))),
  () => Promise.all(lights.map(id => tweenLightTo(changeIntensity(rgb, 0.5), id, duration))),
])

const createTweenStack = (lights, rgb, duration, size) => {
  const tweenStack = []
  for (let index = 0; index <= size; index++) {
    tweenStack.push(createOneTween(lights, rgb, duration))
  }

  return flat(tweenStack)
}

eventHub.on('keyboard', keys => {
  const { upperCase, lowerCase } = sortCases(keys)
  lowerCase.length && setCurrentFunction(['tweenSlow'])
  upperCase.length && setCurrentFunction(['flashes'])

  const colors = getColors(keys)

  const { activeLights } = state
  const combineAndUpValues = flow([combineRgbs, args => changeIntensity(args, 1.25)])

  const rgb = colors.length > 1
    ? combineAndUpValues(colors)
    : cssToRgbObj(colors[0])

  if (!rgb) return

  if (currentFunctions.includes('flashes')) {
    activeLights.forEach(id => setLight(id, rgb))
  }

  if (currentFunctions.includes('tweenSlow')) {
    const duration = getDuration()
    const lights = [...activeLights]
  
    const stack = createTweenStack(lights, rgb, duration, 3)
    callStack(stack)
    lockLights(activeLights, duration * stack.length)
  }

  if (currentFunctions.includes('tweenFast')) {
    activeLights.forEach(id => tweenLightTo(rgb, id, duration))
  }
})