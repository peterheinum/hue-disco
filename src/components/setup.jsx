import React, { useState } from 'react'
import axios from 'axios'
import '../css/style.css'

export default () => {
  const toJson = stream => stream.json()
  // Declare a new state variable, which we'll call "count"
  const [lights, lightsForSetup] = useState([])
  
  console.log(lightsForSetup)

  const getLightSetup = () => {
    fetch('/api/getConfig')
      .then(toJson)
      .then(res =>
        res.forEach((light, id) => {
          console.log(light)
          // light.productname == 'Hue lightstrip plus' && lights.push({ strip: true, ...light, id })
          // light.productname == 'Hue color lamp' && lights.push({ bulb: true, ...light, id })
        })
      )
  }

  getLightSetup()

  return (
    <div>
      {lights.map(light => {
        <button onClick = {lightsForSetup.push(light)} />
      })}

    </div>
  )
}
