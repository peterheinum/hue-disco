require('./spotifySync')
const { setLight, emptyArray } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')

const vibe = {
  energy:0,
  danceability: 0,
}

eventHub.on('vibe_recieved', _vibe => {
  Object.assign(vibe, _vibe)
})

const tempos = [1, 2, 4, 8, 16, 32]

eventHub.on('tempo_increase', () => {
  if(tempos[tempos.indexOf(rythm) - 1] > -1) {
    rythm = tempos[tempos.indexOf(rythm) - 1]
  }
})

eventHub.on('tempo_decrease', () => {
  if(tempos.indexOf(rythm) + 1 < tempos.length) {
    rythm = tempos[tempos.indexOf(rythm) + 1]
  } 
})

eventHub.on('faster_transition', () => {
  transitiontime - 1 > -1 && transitiontime--
})

eventHub.on('slower_transition', () => {
  transitiontime < 10 && transitiontime++
})

eventHub.on('less_brightness', () => {
  if(bri < 250) bri += 5
})

eventHub.on('more_brightness', () => {
  if(bri < 250) bri += 5
})



eventHub.on('tatums', ({tatums}) => { 

})

eventHub.on('segments', ({segments}) => { 
})

let on = false
let rythm = 4
let last_hue = 0
let transitiontime = 1
let bri = 200

const avg_loudness_array = []

const avg_loudness = () => avg_loudness_array.reduce((acc, cur) => acc = acc+cur, 0)/avg_loudness_array.length


eventHub.on('beats', ({ beats, sections, segments, tatums, bars, index }) => { 
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
      flashdown({ id, hue, intensity: 0.5 })
    }
  }
})

eventHub.on('bars', ({bars}) => { 
  console.log(bars)
})

eventHub.on('sections', ({sections}) => { 
  // if(sections.tempo > 150) rythm = 4
  // if(sections.tempo < 150) rythm = 2

  emptyArray(avg_loudness_array)
})
