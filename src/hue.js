require('./spotify')
const { event_hub } = require('./eventhub')
const { spin_light } = require('./app')
 
event_hub.on('tatums', tatums => { 
  console.log({tatums})
})

event_hub.on('segments', segments => { 
  console.log({segments})
})

event_hub.on('beats', beats => { 
  console.log({beats})
})

event_hub.on('bars', bars => { 
  console.log({bars})
})

event_hub.on('sections', sections => { 
  console.log({sections})
})