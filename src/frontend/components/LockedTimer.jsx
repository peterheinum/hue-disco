import { flow } from 'lodash'
import React, { useState, useEffect } from 'react'
import { useInterval } from '../hooks/useInterval'

import {
  full_size,
  full_height,
  flex_column,
  flex_center,
  keyboard_style,
  circle,
  space_around,
  white_text,
  half_size,
  battery_shape,
  battery_internal,
  lovisas_style
} from '../css'


export default ({ lockedLight, timeLocked }) => {
  const partOfTime = timeLocked / 20
  const [duration, setDuration] = useState(timeLocked)

  useInterval(() => {
    setDuration(duration - partOfTime)
  }, duration ? partOfTime : null)

  return (
    duration
      ? <div style={{ ...flex_center, ...flex_column }}>
        <h1 style={{ ...white_text, ...lovisas_style }}>{lockedLight.toString()}</h1>
        <div style={{ ...battery_shape }}><div style={{ ...battery_internal, height: 100 - ((duration / timeLocked) * 100) + '%' }}></div></div>
      </div>
      : null
  )
}