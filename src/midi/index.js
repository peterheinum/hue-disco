const midi = require('midi')
const input = new midi.Input()
const { getRgbFromCssStr } = require('../utils/helpers')
const { setLight } = require('../services/LightLab/lights')

input.getPortCount() === 1 
? input.openPort(0) 
: console.log('no midi connected')

const white = { r: 255, g: 255, b: 255 }
const maxRed = { r: 240, g: 0, b: 0 }
const maxGreen = { r: 0, g: 255, b: 0 }
const maxBlue = { r: 0, g: 0, b: 255 }
const maxPurple = { r: 255, g: 0, b: 255 }
const halfRed = { r: 50, g: 0, b: 0 }
const toRgb = (css) => {
  const [r, g, b] = getRgbFromCssStr(css)
  return { r, g, b }
}

const icyBlue = toRgb('rgb(99.60437429615592,228.18536167903056,255)')
const blushPink = toRgb('rgb(255,84.39173496631392,96.3788017807439)')
const plushPurple = toRgb('rgb(149.7621496578594,109.18919211242677,255)')
const bayBlue = toRgb('rgb(255,83.08178636818519,255)')
const bloodOrange = toRgb('rgb(255,105.9744280591412,6.181212814216252')
const lime = toRgb('rgb(255,213.73679735682896,60.3049463858102)')


const midiMap = {
  // 4 hi hat foot
  '38': icyBlue, //snare 
  '48': bloodOrange, //t1   
  '45': bayBlue, //t2 
  '43': plushPurple, // t3
  '36': blushPink, //kick  
  // '40': maxBlue, 
  // '46': maxRed, // open hi hat
  // '49': maxBlue, 
  // '51': halfRed, //ride 
  '59': lime, //ride (open) 
}

const lightMap = {
    // 4 hi hat foot
    '38': [3], //snare  
    '48': [3], //t1  
    '45': [5], //t2 
    '43': [6], // t3
    '36': [1], //kick  
    // '40': maxBlue, 
    // '46': maxRed, // open hi hat
    // '49': maxBlue, 
    // '51': halfRed, //ride 
    '59': [1, 3], //ride (open) 
}


const handleMidiInput = (time, [n, channel, x]) => {
  console.log(n, channel, midiMap[channel])
  const iterate = id => midiMap[channel] && setLight(id, midiMap[channel])
  lightMap[channel] && lightMap[channel].forEach(iterate)
}


input.on('message', handleMidiInput)