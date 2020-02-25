import React, { useState, useEffect } from 'react'
import { WbIncandescent, LinearScale, HourglassEmpty } from '@material-ui/icons'

import axios from 'axios'

const xyBriToRgb = (x, y, bri) => {
  let z, Y, X, Z, r, g, b, maxValue
  z = 1.0 - x - y
  Y = bri / 255.0 // Brightness of lamp
  X = (Y / y) * x
  Z = (Y / y) * z
  r = X * 1.612 - Y * 0.203 - Z * 0.302
  g = -X * 0.509 + Y * 1.412 + Z * 0.066
  b = X * 0.026 - Y * 0.072 + Z * 0.962
  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055
  maxValue = Math.max(r, g, b)
  r /= maxValue
  g /= maxValue
  b /= maxValue
  r = r * 255; if (r < 0) { r = 255 };
  g = g * 255; if (g < 0) { g = 255 };
  b = b * 255; if (b < 0) { b = 255 };
  return `rgb(${[r, g, b].toString()})`
}

//<Style>
const full_size = {
  height: 100 + '%',
  width: 100 + '%',
}

const flex_center = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const circle = {
  borderRadius: 50 + '%',
  height: 100 + 'px',
  width: 100 + 'px'
}

const space_around = {
  justifyContent: 'space-around'
}

const flex_column = {
  flexDirection: 'column'
}

const btnOriginalColor = 'rgb(75,181,67)'
const shadedBtnColor = 'rgb(65,171,57)'

const button = {
  height: 50 + 'px',
  width: 100 + 'px',
  borderRadius: 6 + 'px'
}

//</Style>
//Poor mans styling

export default ({ setSetupComplete }) => {
  const [lights, setLights] = useState([])
  const [lightsForSetup, setLightsForSetup] = useState([])
  const [btnColor, setBtnColor] = useState('rgb(75,181,67)')

  const sortLightTypes = lights => Object.keys(lights).map(key =>
    lights[key].productname == 'Hue color lamp'
      ? { bulb: true, ...lights[key], id: key, currentColor: xyBriToRgb(lights[key].state.xy[0], lights[key].state.xy[1], lights[key].state.bri) }
      : { strip: true, ...lights[key], id: key, currentColor: xyBriToRgb(lights[key].state.xy[0], lights[key].state.xy[1], lights[key].state.bri) }
  )

  const getLightSetup = () => axios.get('/api/getConfig').then(res => setLights(sortLightTypes(res.data)))

  const addAndFlashLight = light => {
    setLightsForSetup([...lightsForSetup, light])
    axios.post('/api/flashLight/', { light })
  }
  
  const saveGroup = () => {
    // await axios.post('/api/createGroup/', { lightsForSetup })
    setTimeout(() => {
      setSetupComplete()
    }, 2000)
  }

  const indicateLight = light =>
    lightsForSetup.find(_light => _light.id == light.id)
      ? setLightsForSetup(lightsForSetup.filter(_light => _light.id != light.id))
      : addAndFlashLight(light)

  useEffect(() => {
    !lights.length && getLightSetup()
  }, [lights])

  return (
    <div style={{ ...full_size, ...flex_center, ...flex_column, ...space_around }}>
      <h2> Create setup </h2>
      {lights.length > 0
        ? (
          <div style={{ ...full_size, ...flex_center, ...space_around }}>
            {(lights.map(light =>
              <div onClick={() => indicateLight(light)} key={light.id}
                style={{
                  ...circle,
                  ...flex_center,
                  opacity: lightsForSetup.includes(light) ? 1 : 0.5,
                  backgroundColor: light.currentColor
                }}>
                {light.bulb ? (<WbIncandescent />) : (<LinearScale />)}
              </div>
            ))}
          </div>
        )
        : (<div> <HourglassEmpty /> </div>)
      }
      <div
        onMouseLeave={() => setBtnColor(btnOriginalColor) }
        onMouseEnter={() => setBtnColor(shadedBtnColor) } 
        onClick={() => saveGroup()}
        style={{ ...flex_center, ...button, backgroundColor: btnColor }}>  
      </div>
    </div>
  )
}
