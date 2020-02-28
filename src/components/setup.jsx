import React, { useState, useEffect } from 'react'
import { WbIncandescent, LinearScale, HourglassEmpty, Edit } from '@material-ui/icons'

import axios from 'axios'

const xyBriToRgb = (x, y, bri) => {
  let z, Y, X, Z, r, g, b, maxValue
  z = 1.0 - x - y
  Y = bri / 255.0 // Brightness of lamp
  X = (Y / y) * x
  Z = (Y / y) * z
  r = X * 1.612 - Y * 0.203 - Z * 0.302
  g = -X * 0.509 + Y * 1.412 + Z * 0.066
  b = X * 0.026 - Y * 0.072 + Z * 0.962
  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055
  maxValue = Math.max(r, g, b)
  r /= maxValue
  g /= maxValue
  b /= maxValue
  r = r * 255; if (r < 0) r = 255
  g = g * 255; if (g < 0) g = 255
  b = b * 255; if (b < 0) b = 255
  return `rgb(${[r, g, b].toString()})`
}

//<Style>
const full_size = {
  height: 100 + '%',
  width: 100 + '%',
}
const full_width = {
  width: 100 + '%'
}

const flex_center = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const circle = {
  borderRadius: 50 + '%',
  height: 100 + 'px',
  width: 100 + 'px'
}

const button = {
  height: 50 + 'px',
  width: 100 + 'px',
  borderRadius: 6 + 'px'
}

const space_around = {
  justifyContent: 'space-around'
}

const flex_column = {
  flexDirection: 'column'
}

const white_text = {
  color: 'whitesmoke'
}

const btnOriginalColor = 'rgb(65,171,57)'
const shadedBtnColor = 'rgb(95,211,77)'

const createButtonStyle = { ...flex_center, ...button, ...white_text }
const editButtonStyle = { ...flex_center, ...button, ...white_text }

const bigColumnContainer = { ...full_size, ...flex_center, ...flex_column, ...space_around }
const lightCircleContainer = { ...full_width, ...flex_center, ...space_around }


//</Style>
//Poor mans styling

export default ({ setSetupComplete }) => {
  const [lights, setLights] = useState([])
  const [lightsForSetup, setLightsForSetup] = useState([])
  const [existingGroups, setExistingGroups] = useState([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [btnColor, setBtnColor] = useState('rgb(65,171,57)')

  useEffect(() => {
    !lights.length && getLightSetup().then(({ data }) => setLights(sortLightTypes(data)))
    !existingGroups.length && getExistingGroups().then(({ data }) => setExistingGroups(data))
  }, [lights, existingGroups])

  const getLightSetup = () => axios.get('/api/getConfig')
  const getExistingGroups = () => axios.get('/api/getGroups')

  const sortLightTypes = lights => Object.keys(lights).map(key =>
    lights[key].productname == 'Hue color lamp'
      ? { bulb: true, ...lights[key], id: key, currentColor: xyBriToRgb(lights[key].state.xy[0], lights[key].state.xy[1], lights[key].state.bri) }
      : { strip: true, ...lights[key], id: key, currentColor: xyBriToRgb(lights[key].state.xy[0], lights[key].state.xy[1], lights[key].state.bri) }
  )

  const indicateLight = light =>
    lightsForSetup.find(_light => _light.id == light.id)
      ? setLightsForSetup(lightsForSetup.filter(_light => _light.id != light.id))
      : addAndFlashLight(light)

  const addAndFlashLight = light => {
    setLightsForSetup([...lightsForSetup, light])
    flashLight(light)
  }

  const flashLight = light => axios.post('/api/flashLight/', { light })

  const addOrRemoveFromGroup = lightId => {
    const removeLightFromGroup = (id, group) => {
      const newGroup = { ...group, lights: group.lights.filter(light => light != id) }
      existingGroups.splice(existingGroups.indexOf(group), 1)
      setExistingGroups([newGroup, ...existingGroups])
    }

    const addLightToGroup = (id, group) => {
      existingGroups.splice(existingGroups.indexOf(group), 1)
      group.lights = [...group.lights, id]
      setExistingGroups([group, ...existingGroups])
      flashLight({ id })
    }

    const group = existingGroups.find(group => group.id == editingGroup)
    group.lights.find(light => light == lightId)
      ? removeLightFromGroup(lightId, group)
      : addLightToGroup(lightId, group)
  }

  //Button functions
  const edit = () => {
    setEditing(false)
    setCreating(true)
  }

  const create = () => {
    setCreating(false)
    setEditing(true)
  }

  const handleClose = async () => {
    if(creating) {
      await axios.post('/api/createGroup/', { lightsForSetup })
    } 
    
    if(editing) {
      const group = existingGroups.find(({ id }) => id == editingGroup)
      await axios.post('/api/editGroup/', { group })
    }
    
    setSetupComplete(true)
  }

  const saveAndGoBack = () => editing || creating 
      ? handleClose()
      : setSetupComplete(true)

  return (
    <div style={bigColumnContainer}>
      {!lights.length && (<div> <HourglassEmpty /> </div>)}
      <div style={{ ...full_width, ...flex_center, ...flex_column }}>
        <h2> Create setup or edit existing </h2>
        <div style={lightCircleContainer}>
          <div
            onClick={edit}
            style={{ ...createButtonStyle, backgroundColor: creating ? 'rgb(195,151,177)' : 'rgb(175,121,157)' }}>
            Create
          </div>
          <div
            onClick={create}
            style={{ ...editButtonStyle, backgroundColor: editing ? 'rgb(95,211,77)' : 'rgb(65,171,57)' }}>
            Edit
        </div>
        </div>
      </div>
      {creating || editing
        ? lights.length > 0 && creating
          ? (
            <div style={{ ...full_size, ...flex_center, ...space_around }}>
              {(lights.map(light =>
                <div onClick={() => indicateLight(light)} key={light.id}
                  style={{
                    ...circle,
                    ...flex_center,
                    opacity: lightsForSetup.includes(light) ? 1 : 0.5,
                    backgroundColor: light.currentColor
                  }}>
                  {light.id}
                  {light.bulb ? (<WbIncandescent />) : (<LinearScale />)}
                </div>
              ))}
            </div>
          )
          : (<div style={{ ...full_size, ...flex_column, ...flex_center, ...space_around }}>
            {(existingGroups.map(group =>
              <div>
                <div>
                  {group.name}
                </div>
                <div style={lightCircleContainer}>
                  {group.lights.map((id, index) => {
                    const light = lights.find(x => x.id == id)
                    return (<div onClick={() => indicateLight(light)} key={index + 1000}
                      style={{
                        ...circle,
                        ...flex_center,
                        opacity: lightsForSetup.includes(light) ? 1 : 0.5,
                        backgroundColor: light.currentColor
                      }}>
                      {light.id}
                      {light.bulb ? (<WbIncandescent />) : (<LinearScale />)}
                    </div>)
                  })}

                  <div onClick={() => setEditingGroup(group.id)} style={{
                    ...circle,
                    ...flex_center,
                    backgroundColor: lights[0].currentColor,
                    opacity: editingGroup == group.id ? 1 : 0.5
                  }}><Edit /> </div>
                </div>
                
                <div style={lightCircleContainer}>
                  {editingGroup == group.id && (lights.map((light, index) =>
                    <div onClick={() => addOrRemoveFromGroup(light.id)} key={index+3000}
                      style={{
                        ...circle,
                        ...flex_center,
                        opacity: group.lights.includes(light.id) ? 1 : 0.5,
                        backgroundColor: light.currentColor
                      }}>
                      {light.id}
                      {light.bulb ? (<WbIncandescent />) : (<LinearScale />)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>)
        : (<div style={{ ...full_size, ...flex_center, ...space_around }}> Edit or Create new? Up to you! </div>)
      }
      <div
        onMouseLeave={() => setBtnColor(btnOriginalColor)}
        onMouseEnter={() => setBtnColor(shadedBtnColor)}
        onClick={() => saveAndGoBack()}
        style={{ ...flex_center, ...button, ...white_text, backgroundColor: btnColor }}>
        Done
      </div>
    </div>
  )
}
