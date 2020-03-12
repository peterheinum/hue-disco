import React, { useState } from 'react'
import { WbIncandescent, LinearScale, Edit } from '@material-ui/icons'
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

import axios from 'axios'


export default ({ lights, setMenuChoice, existingGroups, setExistingGroups }) => {
  const [lightsForSetup, setLightsForSetup] = useState([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [btnColor, setBtnColor] = useState('rgb(65,171,57)')

  const indicateLight = light =>
    lightsForSetup.find(_light => _light.id == light.id)
      ? setLightsForSetup(lightsForSetup.filter(_light => _light.id != light.id))
      : addAndFlashLight(light)

  const flashLight = light => axios.post('/api/flashLight/', { light })

  const addAndFlashLight = light => {
    setLightsForSetup([...lightsForSetup, light])
    flashLight(light)
  }


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

  const handleSave = async () => {
    console.log(creating, editing)
    if (creating) {
      await axios.post('/api/createGroup/', { lightsForSetup })
      alert(`group has been created with [${lightsForSetup.map(x => x.id)}]`)
    }

    if (editing) {
      await axios.post('/api/editGroup/', { group: existingGroups.find(({ id }) => id == editingGroup) })
      alert(`group ${editingGroup} has been saved`)
    }
    
    setMenuChoice(null)
  }     

  return (
    <div style={bigColumnContainer}>
      <div style={{ ...full_width, ...flex_center, ...flex_column }}>
        <h2 style={white_text}> Create setup or edit existing </h2>
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
                <div style={white_text}>
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
                    <div onClick={() => addOrRemoveFromGroup(light.id)} key={index + 3000}
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
        : (<div style={{ ...full_size, ...flex_center, ...space_around, ...white_text }}> Edit or Create new? Up to you! </div>)
      }
      <div
        onMouseLeave={() => setBtnColor(btnOriginalColor)}
        onMouseEnter={() => setBtnColor(shadedBtnColor)}
        onClick={() => handleSave()}
        style={{ ...flex_center, ...button, ...white_text, backgroundColor: btnColor }}>
        Done
      </div>
    </div>
  )
}

