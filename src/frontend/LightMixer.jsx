import React, { useState, useEffect } from 'react'
import { SketchPicker } from 'react-color'
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

export default () => {
  const [colors, setColors] = useState()
  const [color, setColor] = useState('#000000')

  return (
    <div style={{ ...full_size, ...flex_center }}>
      {/* <SketchPicker color={color} onChange={setColor} /> */}
      <div style={ grid_container }>
        {Object.keys(colorMap).map((tone, index) =>
           <div style={{ backgroundColor: colorMap[tone], ...circle}}> {tone} </div>
        )}
      </div>
    </div>
  )
}