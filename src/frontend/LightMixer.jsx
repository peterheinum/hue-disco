import React, { useState, useEffect } from 'react'
import { SketchPicker } from 'react-color'
import {
  full_size,
  full_width,
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

export default () => {
  const [colors, setColors] = useState()
  const [color, setColor] = useState('#000000')
  
  return (
    <div style={{ ...full_size, ...flex_center }}>

      <SketchPicker color={color} onChange={setColor} />
    </div>
  )
}