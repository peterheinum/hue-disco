const midi = require('midi')
const input = new midi.Input()
const { getRgbFromCssStr, flat, unique, rand } = require('../utils/helpers')
const { setLight, randomRgb } = require('../services/LightLab/lights')
console.log(input.getPortCount())
input.getPortCount() > 0
  ? input.openPort(0)
  : console.log('no midi connected')

const white = { r: 255, g: 255, b: 255 }

const compose = (...fns) => (params) => fns.reduce((acc, fn) => fn(acc), params)
const rgbArrToObj = ([r, g, b]) => ({ r, g, b })

const toRgbObj = (css) => compose(getRgbFromCssStr, rgbArrToObj)(css)

const icyBlue = toRgbObj('rgb(99.60437429615592,228.18536167903056,255)')
const blushPink = toRgbObj('rgb(255,84.39173496631392,96.3788017807439)')
const plushPurple = toRgbObj('rgb(149.7621496578594,109.18919211242677,255)')
const bayBlue = toRgbObj('rgb(255,83.08178636818519,255)')
const bloodOrange = toRgbObj('rgb(255,105.9744280591412,6.181212814216252')
const lime = toRgbObj('rgb(255,213.73679735682896,60.3049463858102)')
const redViolet = toRgbObj('rgb(219,112,147)')

const channelMap = {
  38: 'snare',
  48: 't1',
  45: 't2',
  43: 't3',
  48: 't1',
  36: 'kick',
  4: 'hiHat',
  46: 'openHiHat',
  55: 'openCrash',
  59: 'openRide'
}

const drumColors = {
  // 4 hi hat foot
  snare: bloodOrange,
  t1: icyBlue,
  t2: bayBlue,
  t3: plushPurple,
  //  kick: white,   
  openCrash: blushPink,
  openRide: lime,
  openHiHat: redViolet
  // '40': maxBlue, 
  // 'openHiHat': maxRed, // open hi hat
  // '51': halfRed, //ride 
}

/* Home */
// const lightMap = {
//     // 4 hi hat foot
//     snare: [3],  
//     t1: [3],  
//     t2: [5],  
//     t3: [6], 
//     kick: [1],   
//     openCrash: [1],
//     openRide: [1], 

//     // '40': maxBlue, 
//     // '46': maxRed, // open hi hat
//     // '51': halfRed, //ride 
// }

/* Elias place */
const lightMap = {
  // 4 hi hat foot
  snare: [5],
  t1: [7],
  t2: [8],
  t3: [4],
  kick: [6],
  openCrash: [4],
  openRide: [5],
  openHiHat: [8]

  // '40': maxBlue, 
  // '46': maxRed, // open hi hat
  // '49': maxBlue, 
  // '51': halfRed, //ride 
}

const matchingArrays = (a, b) => a.filter((obj, i) => obj == b[i]).length === b.length
const availableLights = unique(flat(Object.keys(lightMap).map(key => lightMap[key])))
const getRandLight = () => availableLights[rand(availableLights.length)]

const getSomeLights = amount => {
  const arr = []
  for (let i = 0; i < amount; i++) {
    arr.push(getRandLight())
  }

  return unique(arr)
}

const applyFn = lights => fn => lights.forEach(fn)

let lastHit = null
let state = 'normal'
const sequence = []

const changeStateOnSequence = () => {
  const path = ['t3', 't3', 't3', 't3', 't3', 't3']
  console.log(sequence)
  if (matchingArrays(path, sequence)) {
    state = state === 'wack' ? 'normal' : 'wack'
  }
}

const craze = (amount = 2) => () => {
  const lights = getSomeLights(amount)
  const fn = id => setLight(id, randomRgb())
  applyFn(lights)(fn)
}

const normalApply = () => (drum) => {
  const fn = id => drumColors[drum] && setLight(id, drumColors[drum])
  const lights = lightMap[drum]
  applyFn(lights)(fn)
}

/* 5 t3 in a row will activate wack  */
const checkIfChangeState = () => (drum) => {
  sequence.push(drum)
  if (sequence.length > 5) {
    sequence.splice(0, 1)
  }

  changeStateOnSequence()
}

const handleMidiInput = (time, [n, channel, x]) => {
  const drum = channelMap[channel]

  const fns = [
    [n == 137, checkIfChangeState],
    [state == 'wack', craze],
    [state === 'normal', normalApply],

    /* Two snares in a row */
    [state === 'normal' && n == 137 && lastHit == drum && drum == 'snare', craze],
  ]

  fns.filter(([bool]) => bool)
    .forEach(([__, fn, params]) => fn(params)(drum))

  lastHit = drum
}

input.on('message', handleMidiInput)
