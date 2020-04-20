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
const getRgbFromCssStr = str => str.split('rgb(')[1].split(')')[0].split(',')

const getAvarageRGB = colorMap => {
  const [r, g, b] = sumRgb(colorMap).map(n => n / Object.keys(colorMap).length)
  return getRgbAsString({ r, g, b })
}

const sumRgb = colorMap => Object.keys(colorMap).map(key => colorMap[key]).reduce((acc, cur) => {
  const [r, g, b] = getRgbFromCssStr(cur).map(x => parseInt(x))
  acc[0] += r
  acc[1] += g
  acc[2] += b
  return acc
}, [0, 0, 0])

const sortTones = ({ data }) => {
  const { lights } = data
  return Object.keys(lights).map(key => lights[key]).reduce((acc, cur) => {
    const { tones, id } = cur 
    tones.forEach(tone => acc[tone] = id)
    return acc
  }, {})
}



export default () => {
  const [colors, setColors] = useState(colorMap)
  const [toneAndId, setToneAndId] = useState({})
  const [picking, setPicking] = useState('')
  const [text, setText] = useState('')

  const colorHandler = ({ rgb }) => {
    const cssRBG = getRgbAsString(rgb)
    setColors({ ...colors, [picking]: cssRBG })
  }
  const handleColorChange = throttle(colorHandler, 50)

  const textHandler = ({ target }) => {
    const { value } = target
    setText(value)
  }

  const handleTextChange = throttle(textHandler, 100)

  const saveSetup = () => {
    const id = text || 'no name'
    localStorage.getItem('savedSetups')
      ? localStorage.setItem('savedSetups', JSON.stringify({ ...JSON.parse(localStorage.getItem('savedSetups')), [id]: colors }))
      : localStorage.setItem('savedSetups', JSON.stringify({ [id]: colors }))

    setPicking('')
    setText('')
    axios.post('/api/setColors', { colors })
      .then(sortTones)
      .then(setToneAndId)
      .catch(console.error)
  }

  const loadSaved = id => {
    const savedSetups = JSON.parse(localStorage.getItem('savedSetups'))
    const colors = savedSetups[id]
    setColors(colors)
    setText(id)
  }


  return (
    <div style={{ ...full_size, ...flex_center, ...flex_column }}>
      <div style={{ ...full_width, ...flex_center, flexDirection: 'row' }}>
        {localStorage.getItem('savedSetups') && Object.keys(JSON.parse(localStorage.getItem('savedSetups'))).map(id =>
          <div style={{ backgroundColor: getAvarageRGB(JSON.parse(localStorage.getItem('savedSetups'))[id]), ...circle, textAlign: 'center' }} onClick={() => loadSaved(id)}> {id} </div>
        )}
      </div>
      {picking && <SketchPicker style="margin-top:10px;" color={colors[picking]} onChange={handleColorChange} />}
      <div style={{ ...flex_center, ...half_size }} >
        <div style={grid_container}>
          {Object.keys(colors).map(tone =>
            <div style={{ backgroundColor: colors[tone], ...circle, textAlign: 'center' }} onClick={() => setPicking(tone)}> {tone}<br /><p>{toneAndId[tone]}</p> </div>
          )}
        </div>
      </div>
      <div style={{ ...flex_center }}>
        <input onChange={handleTextChange} value={text}></input>
        <div style={{ ...button, ...createButtonStyle, ...white_text, backgroundColor: btnOriginalColor }} onClick={saveSetup}> Save </div>
      </div>
    </div>
  )
}