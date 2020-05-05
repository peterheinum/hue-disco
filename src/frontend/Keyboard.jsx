import openSocket from 'socket.io-client'
const socket = openSocket('http://localhost:3000')
import { flow } from 'lodash'
import React, { useState, useEffect } from 'react'
import { useInterval } from './hooks/useInterval'
import { getColorForCombination, sortMessage, sortCases } from './helpers'
import LockedTimer from './components/LockedTimer'

import {
  full_size,
  full_height,
  flex_column,
  flex_center,
  keyboard_style,
  circle,
  space_around,
  white_text,
  full_width,
  half_size,
  battery_shape,
  battery_internal,
  space_between,
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
const lessenTimers = (acc, cur) => {
  acc[cur] === 300 && delete acc[cur]
  acc[cur] && acc[cur] > 0
    ? acc[cur] -= time / 20
    : delete acc[cur]
  return acc
}

const time = 6000

const createMaxedTimers = lights => lights.reduce((acc, cur) => ({ ...acc, [cur]: time }), {})

export default () => {
  const [text, setText] = useState('try me')
  const [activeLights, setActiveLights] = useState([])
  const [lockedLights, setLockedLights] = useState({})
  const [rgb, setRgb] = useState({ ...lightColors })

  const keys = obj => Object.keys(obj)

  const partOfTime = time / 20
  useInterval(() => {
    setLockedLights(keys(lockedLights).reduce(lessenTimers, lockedLights))
  }, keys(lockedLights).length ? partOfTime : null)

  let keysPressed = {}

  const addKeyPress = ({ key }) => {
    keysPressed[key] = true
  }

  const setRgbForActiveLights = _rgb => {
    const newRgb = { ...rgb }
    activeLights.forEach(id => newRgb[id] = _rgb)
    setRgb(newRgb)
  }

  const durationSortedLockedLights = () => keys(lockedLights).map(key => [lockedLights[key], key]).sort((a, b) => a[0]-b[0]).map(o => o[1])

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
        setLockedLights({ ...lockedLights, ...createMaxedTimers(activeLights) })
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
        <div style={{ ...full_width, ...flex_center, ...space_between }}>
          {keys(lockedLights).length ? durationSortedLockedLights().map((light, index) => <LockedTimer key={index} lockedLight={light} timeLocked={6000} />) : null}
        </div>

        <h1 style={{ ...white_text, ...lovisas_style }}>{'Active: ' + activeLights.toString().split(',').join(' ')}</h1>
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