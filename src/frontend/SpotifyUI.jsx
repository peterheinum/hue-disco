import React, { useState, useEffect } from 'react'
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

  const syncSpotify = () => {
    setInitSync(true)
    localStorage.setItem('spotifySync', Date.now())
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