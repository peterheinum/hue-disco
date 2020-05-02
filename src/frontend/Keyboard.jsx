import openSocket from 'socket.io-client'
const socket = openSocket('http://localhost:3000')
import { flow } from 'lodash'
import React, { useState, useEffect } from 'react'
import { getColorForCombination, sortMessage, sortCases } from './helpers'

import {
  full_size,
  full_height,
  flex_column,
  flex_center,
  keyboard_style,
  circle,
  space_around,
  white_text
} from './css'

export default () => {
  const [text, setText] = useState('try me')
  const [activeLights, setActiveLights] = useState([])

  const [rgb, setRgb] = useState('rgb(255, 155, 255)')

  let keysPressed = {}

  const addKeyPress = ({ key }) => {
    keysPressed[key] = true
  }


  const handleKeyUp = () => {
    if (Object.keys(keysPressed).length) {
      const combinations = Object.keys(keysPressed)
      socket.emit('message', combinations)
      flow([getColorForCombination, setRgb])(combinations)

      const textValue = combinations.toString().split(',').join('')
      setText(textValue)

      const { ints } = sortMessage(combinations)
      const { upperCase, lowerCase } = sortCases(combinations)

      if (ints.length) {
        setActiveLights(ints)
      }
      // else if(!upperCase.length && lowerCase.length) {
      //   setActiveLights([])
      // }

      keysPressed = {}
    }
  }

  return (
    <div style={{ ...full_size, ...flex_center }}>
      <div style={{ ...full_height, ...flex_center, ...flex_column, ...space_around, marginRight: '50px' }}>
        <div style={{ ...circle, backgroundColor: rgb }} />
        <div style={{ ...circle, backgroundColor: rgb }} />
        <div style={{ ...circle, backgroundColor: rgb }} />
        <div style={{ ...circle, backgroundColor: rgb }} />
      </div>
      <div style={{ ...flex_center, ...flex_column }}>
        <h1 style={{ ...white_text }}>{activeLights.toString().split(',').join(' ')}</h1>
        <input value={text} style={keyboard_style} onKeyDown={addKeyPress} onKeyUp={handleKeyUp}></input>
      </div>
      <div style={{ ...full_height, ...flex_center, ...flex_column, ...space_around, marginLeft: '50px' }}>
        <div style={{ ...circle, backgroundColor: rgb }} />
        <div style={{ ...circle, backgroundColor: rgb }} />
        <div style={{ ...circle, backgroundColor: rgb }} />
        <div style={{ ...circle, backgroundColor: rgb }} />
      </div>
    </div>
  )
}