import openSocket from 'socket.io-client'
const socket = openSocket('http://localhost:3000')
import React, { useState, useEffect } from 'react'
import { full_size, flex_column, flex_center } from './css'

export default () => {
  const keysPressed = {}
  const addKeyPress = ({ key }) => {
    keysPressed[key] = true
  }
  
  const cleanObject = obj => Object.keys(obj).forEach(key => delete obj[key])

  const emit = () => {
    if(Object.keys(keysPressed).length) {
      socket.emit('message', Object.keys(keysPressed))
      cleanObject(keysPressed)
    }
  }

  return (
    <div style={{...full_size, ...flex_center, ...flex_column}}>
      <input onKeyDown={addKeyPress} onKeyUp={emit}></input>
    </div>
  )
}