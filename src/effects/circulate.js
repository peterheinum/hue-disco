require('dotenv').config({ path: __dirname + '../../.env' })
const { get, sleep } = require('../utils/helpers')

Array.prototype.last = function () {
  return this[this.length - 1]
}

const keys = object => Object.keys(object)

const set_current_color = ({ id, hue, bri }) => state.lights.splice(state.lights.indexOf(state.lights.find(light => light.id == id)), 1, { id, hue, bri })

const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY

const state = {
  lights: [],
  details: [],
  smoothness: 20,
  distances: []
}

const set_colors = (chosen_colors) => {
  //Red yellow orange chill
  !chosen_colors.length && (chosen_color = 
  [
    { hue: 1000, bri: 200 },
    { hue: 3000, bri: 250 },
    { hue: 5500, bri: 230  },
    { hue: 2500, bri: 250 },
    { hue: 5000, bri: 175  }
  ])

  const colors = chosen_colors.length
    ? chosen_colors
    : state.lights.map(() => ({ hue: Math.floor((Math.random() * 65000) + 1), bri: Math.floor((Math.random() * 250) + 1) }))
  state.lights.forEach(({ id }, i) => {
    set_light({ id, hue: colors[i].hue, bri: colors[i].bri })
    set_current_color({ id, hue: colors[i].hue, bri: colors[i].bri })
  })

  return Promise.resolve()
}

const get_all_lights = async () => {
  const url = `http://${hue_hub()}/api/${api_key()}/lights/`
  const method = 'GET'
  const result = await get({ url, method })
  return Promise.resolve(result)
}

const set_light = async ({ id, hue, bri }) => {
  hue = Math.floor(hue)
  bri = Math.floor(bri)

  const url = `http://${hue_hub()}/api/${api_key()}/lights/${id}/state`
  const body = { on: true, sat: 254, hue, bri }
  const method = 'PUT'
  const [status] = await get({ url, body, method })
  console.log(status)
  return Promise.resolve()
}


//Calculate how much a hue needs to increase to get to the next value. Same with brightness
//Then push id, dist and bri_dist to [state.distances]
const get_distances_in_colors = () => {
  const { lights, smoothness } = state
  state.distances = []
  lights.forEach((light, i) => {
    const { id } = light
    const to = lights[i + 1]
    const dist = to ? (light.hue - to.hue) / smoothness : (light.hue - lights[0].hue) / smoothness
    const bri_dist = to ? (light.bri - to.bri) / smoothness : (light.bri - lights[0].bri) / smoothness
    state.distances.push({ id, dist, bri_dist })
  })
}



const rotate_lights = async () => {
  const { lights, distances, smoothness } = state

  for (let __ = 0; __ < smoothness; __++) {
    const set_all = async () => {
      for (let i = 0; i < lights.length; i++) {
        const { hue, bri, sat, id } = lights[i]

        const { dist, bri_dist } = distances.find(light => light.id == id)
        const new_hue = hue - dist
        const new_bri = bri - bri_dist

        await set_light({ id, hue: new_hue, bri: new_bri })
        set_current_color({ id, hue: new_hue, bri: new_bri })
      }
      return Promise.resolve()
    }

    await sleep(250)
    await set_all()
  }

  return Promise.resolve()
}


//Get all lights and push important details to [state.lights]
const setup_lights = async () => {
  const lights = await get_all_lights()
  state.lights = []

  keys(lights).forEach(id => {
    const light = lights[id]
    const { hue, bri, sat } = light.state
    state.lights.push({ id, hue, bri, sat })
    state.details.push(light)
  })

  return Promise.resolve()
}

const spin_lights = async (spins = 1000, chosen_colors = []) => {
  await setup_lights()
  await set_colors(chosen_colors)
  for (let i = 0; i < spins; i++) {
    get_distances_in_colors()
    await rotate_lights()
    await sleep(2000)
  }
}

require.main == module && spin_lights()
module.exports = { spin_lights }