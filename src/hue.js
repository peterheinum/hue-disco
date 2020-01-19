require('./spotify')
const { set_light, clear_array } = require('./utils')
const { event_hub } = require('./eventhub')
const { spin_light } = require('./app')
 
const vibe = {
  energy:0,
  danceability: 0,
}

event_hub.on('vibe_recieved', _vibe => {
  Object.assign(vibe, _vibe)
})

const tempos = [1, 2, 4, 8, 16, 32]

event_hub.on('tempoIncrement', () => {
  console.log(tempos.indexOf(rythm))
  if(tempos[tempos.indexOf(rythm) - 1] > -1) {
    rythm = tempos[tempos.indexOf(rythm) - 1]
    console.log(rythm)
  }
})

event_hub.on('tempoDecrement', () => {
  console.log(tempos.indexOf(rythm))
  console.log(tempos.indexOf(rythm) + 1)
  if(tempos.indexOf(rythm) + 1 < tempos.length) {
    rythm = tempos[tempos.indexOf(rythm) + 1]
  } 
})

event_hub.on('tempoDec', () => {
  
})

event_hub.on('tatums', ({tatums}) => { 

})

event_hub.on('segments', ({segments}) => { 

})

let on = false
let rythm = 32
let last_hue = 0

const avg_loudness_array = []

const avg_loudness = () => avg_loudness_array.reduce((acc, cur) => acc = acc+cur, 0)/avg_loudness_array.length

event_hub.on('beats', ({ beats, sections, segments, tatums, bars, index }) => { 
  const { loudness_max } = segments
  avg_loudness_array.push(loudness_max)
  avg_loudness_array.length == 3 && avg_loudness_array.shift()
  
  
  if(index % rythm == 0) {
    let hue = on ? 65000 - last_hue : Math.round((avg_loudness()/-40)*65000)
    // console.log(hue)
    hue > 65000 && (hue = Math.round(hue/2))
    last_hue = hue
    on = !on

    // console.log(sections)
    set_light({id: 3, hue, bri: 190, sat: on ? 150 : 254 })    
    set_light({id: 1, hue, bri: 190, sat: on ? 150 : 254 })    
    // for (let id = 0; id < 7; id++) {
    //   set_light({id, hue, bri: 190, sat: on ? 150 : 254 })    
    // }
  }
})

event_hub.on('bars', ({bars}) => { 

})

event_hub.on('sections', ({sections}) => { 
  // if(sections.tempo > 150) rythm = 4
  // if(sections.tempo < 150) rythm = 2

  clear_array(avg_loudness_array)
})