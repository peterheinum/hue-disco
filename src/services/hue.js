require('./spotify')
const { set_light, clear_array } = require('../utils/helpers')
const { event_hub } = require('../utils/eventhub')
const { spin_light } = require('../effects/circulate')
const flashdown = require('../effects/flashdown')
const fadeup = require('../effects/fadeup')
const fft = require('../utils/interpolate') 

const vibe = {
  energy:0,
  danceability: 0,
}

event_hub.on('vibe_recieved', _vibe => {
  Object.assign(vibe, _vibe)
})

const tempos = [1, 2, 4, 8, 16, 32]

event_hub.on('tempo_increase', () => {
  if(tempos[tempos.indexOf(rythm) - 1] > -1) {
    rythm = tempos[tempos.indexOf(rythm) - 1]
  }
})

event_hub.on('tempo_decrease', () => {
  if(tempos.indexOf(rythm) + 1 < tempos.length) {
    rythm = tempos[tempos.indexOf(rythm) + 1]
  } 
})

event_hub.on('faster_transition', () => {
  transitiontime - 1 > -1 && transitiontime--
})

event_hub.on('slower_transition', () => {
  transitiontime < 10 && transitiontime++
})

event_hub.on('less_brightness', () => {
  if(bri < 250) bri += 5
})

event_hub.on('more_brightness', () => {
  if(bri < 250) bri += 5
})



event_hub.on('tatums', ({tatums}) => { 

})

event_hub.on('segments', ({segments}) => { 
})

let on = false
let rythm = 4
let last_hue = 0
let transitiontime = 1
let bri = 200

const avg_loudness_array = []

const avg_loudness = () => avg_loudness_array.reduce((acc, cur) => acc = acc+cur, 0)/avg_loudness_array.length


event_hub.on('beats', ({ beats, sections, segments, tatums, bars, index }) => { 
  const { loudness_max } = segments
  avg_loudness_array.push(loudness_max)
  avg_loudness_array.length == 3 && avg_loudness_array.shift()
  
  if(index % rythm == 0) {
    let hue = on ? 65000 - last_hue : Math.round((avg_loudness()/-40)*65000)
    hue > 65000 && (hue = Math.round(hue/2))
    last_hue = hue
    on = !on

    fadeup({ id: 1, hue, intensity: 1 })
    for (let id = 2; id < 7; id++) {
      // set_light({id, hue, bri: 250, sat: on ? 150 : 254, transitiontime })    
      flashdown({ id, hue, intensity: 1 })
    }
  }
})

event_hub.on('bars', ({bars}) => { 

})

event_hub.on('sections', ({sections}) => { 
  // if(sections.tempo > 150) rythm = 4
  // if(sections.tempo < 150) rythm = 2

  clear_array(avg_loudness_array)
})
