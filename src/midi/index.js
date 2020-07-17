const midi = require('midi')
const input = new midi.Input()
const { getRgbFromCssStr } = require('../utils/helpers')
const { setLight, randomRgb } = require('../services/LightLab/lights')

input.getPortCount() > 0 
  ? input.openPort(0) 
  : console.log('no midi connected')

const white = { r: 255, g: 255, b: 255 }

const compose = (...fns) => (params) => fns.reduce((acc, fn) => fn(acc), params)
const rgbArrToObj = ([r, g, b]) => ({ r, g, b })

const toRgbObj = (css) => compose(getRgbFromCssStr, rgbArrToObj)(css)

const icyBlue = toRgbObj('rgb(99.60437429615592, 228.18536167903056, 255)')
const blushPink = toRgbObj('rgb(255, 84.39173496631392, 96.3788017807439)')
const plushPurple = toRgbObj('rgb(149.7621496578594, 109.18919211242677, 255)')
const bayBlue = toRgbObj('rgb(255, 83.08178636818519, 255)')
const bloodOrange = toRgbObj('rgb(255, 105.9744280591412, 6.181212814216252')
const lime = toRgbObj('rgb(255, 213.73679735682896, 60.3049463858102)')
const redViolet = toRgbObj('rgb(219, 112, 147)')

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
  snare: icyBlue,  
  t1: bloodOrange,   
  t2: bayBlue,  
  t3: plushPurple, 
  kick: white,   
  openCrash: blushPink,
  openRide: lime,  
  openHiHat: redViolet
  // '40': maxBlue, 
  // 'openHiHat': maxRed, // open hi hat
  // '51': halfRed, //ride 
}

// /* Home */
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

const applyFn = (lights, fn) => lights.forEach(fn)

const handleMidiInput = (time, [n, channel, x]) => {
  const drum = channelMap[channel]
  console.log(n, channel, drumColors[drum])

  
  const fn = id => drumColors[drum] && setLight(id, drumColors[drum])
  const lights = lightMap[drum]
  lights && applyFn(lights, fn)
}

input.on('message', handleMidiInput)
