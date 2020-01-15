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

event_hub.on('sync', () => {
  number--
})

event_hub.on('tatums', ({tatums}) => { 

})

event_hub.on('segments', ({segments}) => { 

})

let on = false
let number = 0
let cap = 4
let last_hue = 0

const avg_loudness_array = []

const avg_loudness = () => avg_loudness_array.reduce((acc, cur) => acc = acc+cur, 0)/avg_loudness_array.length


event_hub.on('beats', ({ beats, sections, segments, tatums, bars }) => { 
  const { loudness_max } = segments
  avg_loudness_array.push(loudness_max)
  avg_loudness_array.length == 3 && avg_loudness_array.shift()
  

  if(number == 0) {
    // console.log(segments, tatums, bars)
    // console.log(sections)
    let hue = on ? 65000 - last_hue : Math.round((avg_loudness()/-40)*65000)
    hue > 65000 && (hue = Math.round(hue/2))
    console.log(avg_loudness())
    last_hue = hue
    console.log(hue)
    on = !on
    // console.log(hue)
    // console.log(sections)
    // console.log('________')
    // console.log(beats)
    // console.log('________')
    // console.log(tatums)
    // console.log('________')
    // console.log(bars)
    // console.log('________')
    // console.log(segments)

    for (let id = 0; id < 7; id++) {
      set_light({id, hue, bri: 190 })    
    }
  }
  number++
  if(number == cap || number > cap) number = 0
})

event_hub.on('bars', ({bars}) => { 

})

event_hub.on('sections', ({sections}) => { 
  clear_array(avg_loudness_array)
})