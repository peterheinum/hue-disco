import React, { useState, useEffect } from 'react'
import { throttle } from 'lodash' 
import { SketchPicker } from 'react-color'
import axios from 'axios'
import {
  full_size,
  half_size,
  full_width,
  grid_container,
  flex_center,
  circle,
  button,
  space_around,
  flex_column,
  white_text,
  btnOriginalColor,
  shadedBtnColor,
  createButtonStyle,
  editButtonStyle,
  bigColumnContainer,
  lightCircleContainer
} from './css'

const colorMap = {
  'C': 'rgb(0, 0, 0)',
  'C#': 'rgb(0, 0, 0)',
  'D': 'rgb(0, 0, 0)',
  'D#': 'rgb(0, 0, 0)',
  'E': 'rgb(0, 0, 0)',
  'F': 'rgb(0, 0, 0)',
  'F#': 'rgb(0, 0, 0)',
  'G': 'rgb(0, 0, 0)',
  'G#': 'rgb(0, 0, 0)',
  'A': 'rgb(0, 0, 0)',
  'A#': 'rgb(0, 0, 0)',
  'B': 'rgb(0, 0, 0)'
}

const getRgbAsString = ({ r, g, b }) => `rgb(${r},${g},${b})`

export default () => {
  const [colors, setColors] = useState(colorMap)
  const [picking, setPicking] = useState('')

  const handler = ({ rgb }) => {
    const cssRBG = getRgbAsString(rgb)
    setColors({ ...colors, [picking]: cssRBG })
  }

  const handleChange = throttle(handler, 50)

  const saveSetup = () => {
    localStorage.getItem('savedSetups')
      ? localStorage.setItem('savedSetups', JSON.stringify([colors, ...JSON.parse(localStorage.getItem('savedSetups'))]))
      : localStorage.setItem('savedSetups', JSON.stringify([colors]))
    axios.post('/api/setColors', { colors })
      .then(console.log)
      .catch(console.error)    
  }

  return (
    <div style={{ ...full_size, ...flex_center, ...flex_column }}>
      {picking && <SketchPicker color={colors[picking]} onChange={handleChange} />}
      <div style={grid_container}>
        {Object.keys(colors).map((tone, index) =>
          <div style={{ backgroundColor: colors[tone], ...circle }} onClick={() => setPicking(tone)}> {tone} </div>
        )}
      </div>
      <div style={{...button, ...createButtonStyle, backgroundColor: btnOriginalColor}} onClick={saveSetup} />
    </div>
  )
}