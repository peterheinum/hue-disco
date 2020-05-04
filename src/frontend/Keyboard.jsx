import openSocket from 'socket.io-client'
const socket = openSocket('http://localhost:3000')
import { flow } from 'lodash'
import React, { useState, useEffect } from 'react'
import { useInterval } from './hooks/useInterval'
import { getColorForCombination, sortMessage, sortCases } from './helpers'

import {
  full_size,
  full_height,
  flex_column,
  flex_center,
  keyboard_style,
  circle,
  space_around,
  white_text,
  half_size,
  battery_shape,
  battery_internal,
  lovisas_style
} from './css'

const lightColors = {
  1: 'rgb(255, 155, 255)',
  2: 'rgb(255, 155, 255)',
  3: 'rgb(255, 155, 255)',
  4: 'rgb(255, 155, 255)',
  5: 'rgb(255, 155, 255)',
  6: 'rgb(255, 155, 255)',
}

export default () => {
  const [text, setText] = useState('try me')
  const [activeLights, setActiveLights] = useState([])
  const [lockedLights, setLockedLights] = useState([])
  const [duration, setDuration] = useState(0)
  const [rgb, setRgb] = useState({ ...lightColors })

  let keysPressed = {}

  const addKeyPress = ({ key }) => {
    keysPressed[key] = true
  }

  useInterval(() => {
    setDuration(duration-50)
  }, duration > 0 ? 50 : null)

  useEffect(() => {
    lockedLights.length && setDuration(6000)
    const timer = setTimeout(() => {
      if (lockedLights.length) {
        setLockedLights([])
        setActiveLights(lockedLights)
      }
    }, 6000)

    return () => {
      clearTimeout(timer)
    }
  }, [lockedLights])

  const setRgbForActiveLights = _rgb => {
    const newRgb = { ...rgb }
    activeLights.forEach(id => newRgb[id] = _rgb)
    setRgb(newRgb)
  }

  const handleKeyUp = () => {
    if (Object.keys(keysPressed).length) {
      const combinations = Object.keys(keysPressed)
      socket.emit('message', combinations)
      flow([getColorForCombination, setRgbForActiveLights])(combinations)

      const textValue = combinations.toString().split(',').join('')
      setText(textValue)

      const { ints } = sortMessage(combinations)
      const { upperCase, lowerCase } = sortCases(combinations)

      if (ints.length) {
        setActiveLights(ints)
      }
      else if (!upperCase.length && lowerCase.length) {
        setLockedLights(activeLights)
        setActiveLights([])
      }

      keysPressed = {}
    }
  }

  return (
    <div style={{ ...full_size, ...flex_center }}>
      <div style={{ ...full_height, ...flex_center, ...flex_column, ...space_around, marginRight: '50px' }}>
        <div style={{ ...circle, backgroundColor: rgb[1] }} />
        <div style={{ ...circle, marginRight: '200px', backgroundColor: rgb[2] }} />
        <div style={{ ...circle, backgroundColor: rgb[3] }} />
      </div>
      <div style={{ ...flex_center, ...flex_column }}>
        <div style={{ ...battery_shape }}><div style={{ ...battery_internal, width: (duration/6000)*100 + '%' }}></div></div>
        <h1 style={{ ...white_text, ...lovisas_style }}>{'Lock: ' + lockedLights.toString().split(',').join(' ')}</h1>
        
        <h1 style={{ ...white_text, ...lovisas_style, marginTop: '-50px' }}>{'Active: ' + activeLights.toString().split(',').join(' ')}</h1>
        {/* <h1 style={{ ...white_text, ...lovisas_style, marginTop: '-50px' }}>{(duration)} </h1> */}
        <input value={text} style={keyboard_style} onKeyDown={addKeyPress} onKeyUp={handleKeyUp}></input>
      </div>
      <div style={{ ...full_height, ...flex_center, ...flex_column, ...space_around, marginLeft: '50px' }}>
        <div style={{ ...circle, backgroundColor: rgb[4] }} />
        <div style={{ ...circle, marginLeft: '200px', backgroundColor: rgb[5] }} />
        <div style={{ ...circle, backgroundColor: rgb[6] }} />
      </div>
    </div>
  )
}