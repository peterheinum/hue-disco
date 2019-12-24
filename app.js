require('dotenv').config()
const fetch = require('node-fetch')

Array.prototype.last = function () {
  return this[this.length - 1]
}

const _resolve = object => Promise.resolve(object)

const sleep = async time => new Promise(resolve => setTimeout(() => resolve(), time))

const keys = object => Object.keys(object)

const get = async ({ url, body, method }) => await fetch(url, { body: JSON.stringify(body), method }).then(res => res.json())

const set_current_color = ({ id, hue }) => state.lights.find(light => light.id == id).hue = hue

const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY

const state = {
  lights: [],
  details: [],
  smoothness: 20,
  distances: [],
}

const set_random_colors = () => {
  const my_random_colors = [43520, 25000, 35000, 65000, 10000]
  const random_colors = my_random_colors.length
    ? my_random_colors
    : state.lights.map(() => Math.floor((Math.random() * 65000) + 1))
  state.lights.forEach(({ id }, i) => set_light({ id, hue: random_colors[i] }) && set_current_color({ id, hue: random_colors[i] }))
  return _resolve()
}

const get_all_lights = async () => {
  const url = `http://${hue_hub()}/api/${api_key()}/lights/`
  const method = 'GET'
  const result = await get({ url, method })
  return _resolve(result)
}

const set_light = async ({ id, hue }) => {
  hue = Math.floor(hue)
  const url = `http://${hue_hub()}/api/${api_key()}/lights/${id}/state`
  const body = { 'on': true, 'sat': 254, 'bri': 120, hue }
  const method = 'PUT'
  await get({ url, body, method })
  return _resolve()
}

const get_distances_in_colors = () => {
  const { lights, smoothness } = state
  state.distances = []
  lights.forEach((light, i) => {
    const to = lights[i + 1]
    const dist = to ? light.hue - to.hue : light.hue - lights[0].hue
    const divided = dist / smoothness
    state.distances.push({ id: light.id, dist: divided })
  })
}

const spin_lights_with_distance = async () => {
  const { lights, distances, smoothness } = state

  for (let __ = 0; __ < smoothness; __++) {
    const set_all = async () => {
      for (let i = 0; i < lights.length; i++) {
        const { hue, bri, sat, id } = lights[i]

        const { dist } = distances.find(light => light.id == id)
        const new_hue = hue - dist

        await set_light({ id: id, hue: new_hue })
        set_current_color({ id, hue: new_hue })
      }
      return _resolve()
    }

    await sleep(1000)
    await set_all()
  }

  return _resolve()
}

const setup_lights = async () => {
  const lights = await get_all_lights()
  state.lights = []

  keys(lights).forEach(id => {
    const light = lights[id]
    const { hue, bri, sat } = light.state
    state.lights.push({ id, hue, bri, sat })
    state.details.push(light)
  })

  return _resolve()
}

const init = async () => {
  await setup_lights()
  await set_random_colors()

  for (let i = 0; i < 10; i++) {
    get_distances_in_colors()
    await spin_lights_with_distance()
    await sleep(2000)
  }
}

init()