import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  full_size,
  full_width,
  flex_center,
  circle,
  button,
  wide_button,
  space_around,
  flex_column,
  white_text,
  createButtonStyle,
  editButtonStyle,
  bigColumnContainer,
  lightCircleContainer
} from './css'


export default ({ lights, existingGroups }) => {
  const [initSync, setInitSync] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null)

  useEffect(() => {
    if (!initSync) {
      Date.now() - localStorage.getItem('lastSpotifySync') < 3600000 && setInitSync(true)
    }
  }, [initSync])

  const go = url => window.location.replace(url)
  const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16)

  const syncSpotify = () => {
    setInitSync(true)
    localStorage.setItem('lastSpotifySync', Date.now())
    go('http://localhost:3000/auth/')
  }

  const activateGroup = id => {
    setActiveGroup(id)
    axios.post(`/api/sync/`, {
      syncId: id,
      existingGroups,
    })
  }

  return (
    <div style={{ ...full_size, ...flex_center, ...flex_column }}>
      {activeGroup
        ? (<div style={{ ...white_text }}> {activeGroup} active </div>)
        : !initSync
          ? (<div onClick={() => syncSpotify()} style={{ ...button, ...white_text, backgroundColor: '#1DB954' }}> Sync </div>)
          : (
            <div style={{ ...full_size, ...flex_center, ...flex_column }}>
              <div style={{ ...white_text }}> Select Group </div>
              {existingGroups.length && existingGroups.map(group => (
                <div onClick={() => activateGroup(group.id)} style={{ ...wide_button, ...white_text, backgroundColor: randomHex() }}> {group.name} </div>
              ))}
            </div>
          )
      }
    </div>
  )
}