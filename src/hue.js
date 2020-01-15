require('./spotify')
const { set_light } = require('./utils')
const { event_hub } = require('./eventhub')
const { spin_light } = require('./app')
 
const vibe = {
  energy:0,
  danceability: 0,
}

event_hub.on('vibe_recieved', _vibe => {
  Object.assign(vibe, _vibe)
})

event_hub.on('tatums', ({tatums}) => { 

})

event_hub.on('segments', ({segments}) => { 

})

let on = false
let number = 0

const avg_loudness_array = []

const avg_loudness = () => avg_loudness_array.reduce((acc, cur) => acc = acc+cur, 0)/avg_loudness_array.length

event_hub.on('beats', ({ beats, sections, segments, tatums, bars }) => { 
  const { loudness_max } = segments
  avg_loudness_array.push(loudness_max)
  avg_loudness_array.length == 10 && avg_loudness_array.shift()
  

  if(number == 0) {
    // console.log(segments, tatums, bars)

    const hue = on ? Math.round((avg_loudness()/-40)*2000) : Math.round((avg_loudness()/-40)*65000)
    on = !on
    console.log(hue)
    for (let id = 0; id < 7; id++) {
      set_light({id, hue, bri: 190 })    
    }
  }
  number++
  if(number == 4) number = 0
})

event_hub.on('bars', ({bars}) => { 

})

event_hub.on('sections', ({sections}) => { 
  console.log('avg spliced')
  avg_loudness_array.splice(0, avg_loudness_array.length)
})