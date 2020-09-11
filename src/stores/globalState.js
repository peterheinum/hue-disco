const { path } = require('ramda')
const state = {
  hasSocket: null,
  existingGroups: [],
  socket: null,
  currentGroup: null,
  lights: {},
  activeLights: [],
  lockedLights: [],
  currentIntensity: 1,
  dampenInterval: null,
  mode: '',
  colorMap: {}
}

  const splitIfNested = args => args.includes('.') ? args.split('.') : [args]

const mutations = () => {
  const setState = (key, value) => state[key] = value
  const getState = (key) => path(splitIfNested(key), state)
  
  const assignState = (obj) => Object.assign(state, obj)
  
  const setLight = (id, value) => {
    console.log('setLight', id, value)
    state['lights'][id] = { ...state['lights'][id], ...value, capacity: 100 }
  }

  return {
    setState,
    getState,
    assignState,
    setLight
  }
}
module.exports = {
  ...mutations(),
  ...state
}