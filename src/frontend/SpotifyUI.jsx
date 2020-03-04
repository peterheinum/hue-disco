import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  full_size,
  full_width,
  flex_center,
  circle,
  button,
  space_around,
  flex_column,
  white_text,
  createButtonStyle,
  editButtonStyle,
  bigColumnContainer,
  lightCircleContainer
} from './css'


export default () => {
  const [initSync, setInitSync] = useState(false)

  useEffect(() => {
    if(!initSync) {
      Date.now() - localStorage.getItem('lastSpotifySync') < 3600000 && setInitSync(true)
    }
  }, [initSync])

  const go = url => window.location.replace(url)
  
  const syncSpotify = () => {
    setInitSync(true)
    localStorage.setItem('lastSpotifySync', Date.now())
    go('http://localhost:3000/auth/')
  }

  return (
    <div style={{ ...full_size, ...flex_center, ...flex_column }}>
      { !initSync
        ? (<div onClick={() => syncSpotify()} style={{ ...button, ...white_text, backgroundColor: '#1DB954' }}> Sync </div>)
        : (<div> hey kid </div>)
      }
    </div>
  )
}