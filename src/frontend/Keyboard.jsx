import openSocket from 'socket.io-client'
const socket = openSocket('http://localhost:3000')
import React, { useState, useEffect } from 'react'

export default () => {
 
  const textHandler = ({ target }) => {
    const { value } = target

    socket.emit('message', value[value.length - 1])
  }

  return (
    <div>
      Hey bro 
      <input onChange={textHandler}></input>
    </div>
  )
}