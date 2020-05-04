import React, { useState, useEffect } from 'react'
import Setup from './Setup'
import LightMixer from './LightMixer'
import SpotifyUI from './SpotifyUI'
import Keyboard from './Keyboard'
import axios from 'axios'
import { HourglassEmpty } from '@material-ui/icons'
import { button, menu_button_position } from './css'

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
  r = r * 255; if (r < 0) r = 255
  g = g * 255; if (g < 0) g = 255
  b = b * 255; if (b < 0) b = 255
  return { currentColor: `rgb(${[r, g, b].toString()})` }
}

export default () => {
  const [init, setInit] = useState(false)
  const [menuChoice, setMenuChoice] = useState(null)
  const [lights, setLights] = useState([])
  const [existingGroups, setExistingGroups] = useState([])

  useEffect(() => {
    if (!init) {
      document.querySelector('*').style = 'padding:0px;margin:0px;'
      document.querySelector('body').style = 'padding:8px;margin:0px;background-color:#191414'
      Date.now() - localStorage.getItem('lastSpotifySync') < 3600000 && setMenuChoice('spotify')
      setInit(true)
    }
  }, [init])

  const sortLightTypes = lights => Object.keys(lights).map(key =>
    lights[key].productname == 'Hue color lamp'
      ? { bulb: true, ...lights[key], id: key, ...xyBriToRgb(lights[key].state.xy[0], lights[key].state.xy[1], lights[key].state.bri) }
      : { strip: true, ...lights[key], id: key, ...xyBriToRgb(lights[key].state.xy[0], lights[key].state.xy[1], lights[key].state.bri) }
  )

  const getLightSetup = () => axios.get('/api/getConfig')
  const getExistingGroups = () => axios.get('/api/getGroups')

  useEffect(() => {
    !lights.length && getLightSetup().then(({ data }) => setLights(sortLightTypes(data)))
    !existingGroups.length && getExistingGroups().then(({ data }) => setExistingGroups(data))
  }, [lights, existingGroups])

  const setupProps = {
    lights,
    existingGroups,
    setMenuChoice,
    setExistingGroups,
  }

  const spotifyProps = {
    lights,
    existingGroups,
  }

  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Bungee+Hairline&display=swap" rel="stylesheet" />
      {init && (
        <div style={menu_button_position}>
        <div onClick={() => setMenuChoice('settings')} style={{ ...button, backgroundColor: 'rgb(150,40,50)' }}> Setup </div>  
        <div onClick={() => setMenuChoice('lightmixer')} style={{ ...button, backgroundColor: 'rgb(0,242,255)' }}> Colors </div>  
        <div onClick={() => setMenuChoice('spotify')} style={{ ...button, backgroundColor: '#1DB954' }}> Spotify </div>  
        <div onClick={() => setMenuChoice('keyboard')} style={{ ...button, backgroundColor: 'rgb(177, 37, 195)' }}> Keyboard </div>  
        {/* <div onClick={() => fetch('/api/testFunction')} style={{ ...button, backgroundColor: '#1DB954' }}> Test functions </div>   */}
      </div>
      )}
      
      {menuChoice == 'settings' ? lights.length ? (<Setup {...setupProps} />) : <HourglassEmpty /> : '' }
      {menuChoice == 'lightmixer' && (<LightMixer />)} 
      {menuChoice == 'spotify' && (<SpotifyUI { ...spotifyProps } />)} 
      {menuChoice == 'keyboard' && (<Keyboard />)} 
    </div>
  )
}