const midi = require('midi');
const { getRgbFromCssStr, flat, unique, rand, randomFromArray, callStack } = require('../utils/helpers')
const { randomRgb, tweenLightTo, createBounceCallstack } = require('../services/lightLab/lights')
const { setLight } = require('../stores/globalState')
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
const lightMap = {
    // 4 hi hat foot
    snare: [3],  
    t1: [3],  
    t2: [5],  
    t3: [6], 
    kick: [1],   
    openCrash: [1],
    openRide: [1], 

    // '40': maxBlue, 
    // '46': maxRed, // open hi hat
    // '51': halfRed, //ride 
}

/* Elias place */
// const lightMap = {
//   // 4 hi hat foot
//   snare: [5],
//   t1: [7],
//   t2: [8],
//   t3: [4],
//   kick: [6],
//   openCrash: [4],
//   openRide: [5],
//   openHiHat: [8]

//   // '40': maxBlue, 
//   // '46': maxRed, // open hi hat
//   // '49': maxBlue, 
//   // '51': halfRed, //ride 
// }


const matchingArrays = (a, b) => a.filter((obj, i) => obj == b[i]).length === b.length
const availableLights = unique(flat(Object.keys(lightMap).map(key => lightMap[key])))
const getRandLight = () => availableLights[rand(availableLights.length)]

const getSomeLights = (amount = 2) => unique(new Array(amount).map(getRandLight))

const applyFn = lights => fn => lights.length && lights.forEach(fn)

let lastHit = null
let state = 'normal'
const sequence = []
const pattern = ['t3', 't3', 't3', 't3', 't3', 't3']

const sequenceMatchespattern = () => matchingArrays(pattern, sequence)

const rows = [[1, 6, 3], [6, 1, 5], [3, 1, 5], [5, 1, 3]]
const getRandomRow = () =>  randomFromArray(rows)

/* On Midi input case handlers */

/* hit two random colors for each hit */
const craze = (amount = 2) => () => {
  const lights = getSomeLights(amount)
  const fn = id => setLight(id, randomRgb())
  applyFn(lights)(fn)
}

/* Let each pad/cymbal play it's color */
const normalApply = () => (drum) => {
  const fn = id => drumColors[drum] && setLight(id, drumColors[drum])
  const lights = lightMap[drum]
  applyFn(lights)(fn)
}

/* 5 t3 in a row will activate wack  */
const checkIfChangeState = () => (drum) => {
  sequence.push(drum)
  sequence.length > pattern.length && sequence.splice(0, 1)
  sequenceMatchespattern() && (state = state === 'bounce' ? 'normal' : 'bounce')
}


/*  */
const tweenKick = (time) => (drum) => {
  const fn = id => tweenLightTo(drumColors[drum], id, time)
  const lights = lightMap[drum]
  applyFn(lights)(fn)
}

/* One two three each less than one another */
const bounceColor = () => (drum) => {
  const color = drumColors[drum]
  if(!color) return
  const lights = getRandomRow()
  const stack = createBounceCallstack(lights, color)
  callStack(stack)
}


// Set up a new input.
const input = new midi.Input();

input.on('message', (time, [n, channel, x]) => {
  console.log(n, channel, x)
  const drum = channelMap[channel]
  if(!lightMap[drum] || n !== 137) return
  const fns = [
    [n == 137, checkIfChangeState],
    [state == 'wack', craze],
    [state === 'normal', normalApply],
    [state === 'bounce', bounceColor]

    /* Two snares in a row */
    // [state === 'normal' && n == 137 && lastHit == drum && drum == 'snare', craze],
  ]

  fns.filter(([bool]) => bool)
    .forEach(([__, fn, params]) => fn(params)(drum))

  lastHit = drum
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  // console.log(`m: ${message} d: ${deltaTime}`);
});
 
// Open the first available input port.
input.openPort(1)
 
// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false);
