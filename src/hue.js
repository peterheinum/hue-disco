require('./spotify')
const { get } = require('./utils')
const { event_hub } = require('./eventhub')
const { spin_light } = require('./app')
 
const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY


const set_light = async ({ id, hue, bri }) => {
  hue = Math.floor(hue)
  bri = Math.floor(bri)

  const url = `http://${hue_hub()}/api/${api_key()}/lights/${id}/state`
  const body = { on: true, sat: 254, hue, bri }
  const method = 'PUT'
  const [status] = await get({ url, body, method })
  return Promise.resolve()
}

event_hub.on('tatums', ({tatums}) => { 

})

event_hub.on('segments', ({segments}) => { 

})

let on = false
let number = 0

event_hub.on('beats', ({ beats, sections }) => { 
  if(number == 0) {

    const { loudness } = sections
    for (let id = 0; id < 7; id++) {
      set_light({id, hue: Math.floor(((sections.key/14) * 65000) + 1), bri: 190 })    
    }
  }
  number++
  if(number == 4) number = 0
})

event_hub.on('bars', ({bars}) => { 

})

event_hub.on('sections', ({sections}) => { 
  spin_light
})