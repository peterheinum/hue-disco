import openSocket from 'socket.io-client'
const socket = openSocket('http://localhost:3000')
import React, { useState, useEffect } from 'react'
import { getColorForCombination } from './helpers'

import { 
  full_size, 
  full_height, 
  flex_column, 
  flex_center, 
  keyboard_style, 
  circle, 
  space_around
} from './css'

export default () => {
  const [text, setText] = useState('try me')
  const [rgb, setRgb] = useState('rgb(255, 155, 255)')

  let keysPressed = {}
  
  const addKeyPress = ({ key }) => {
    try {
      const int = parseInt(key)
      switchLight(int)
    } catch (error) {
      keysPressed[key] = true
    }
  }

  const handleKeyUp = () => {
    if (Object.keys(keysPressed).length) {
      const combinations = Object.keys(keysPressed)
      socket.emit('message', combinations)
      console.log(getColorForCombination(combinations))
      setRgb(getColorForCombination(combinations))
      const textValue = combinations.toString().split(',').join('')

      setText(textValue)
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
      <input value={text} style={keyboard_style} onKeyDown={addKeyPress} onKeyUp={handleKeyUp}></input>
      <div style={{ ...full_height, ...flex_center, ...flex_column, ...space_around, marginLeft: '50px' }}>
        <div style={{ ...circle, backgroundColor: rgb }} /> 
        <div style={{ ...circle, backgroundColor: rgb }} /> 
        <div style={{ ...circle, backgroundColor: rgb }} /> 
        <div style={{ ...circle, backgroundColor: rgb }} /> 
      </div>
    </div>
  )
}