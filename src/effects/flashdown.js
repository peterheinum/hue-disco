const { set_light, sleep } = require('../utils/helpers')



const flashdown = async ({ id, hue, intensity = 0.8 }) => {
  const bri = 250*intensity
  const sat = 254*intensity

  set_light({ id, hue, bri, sat, transitiontime: 0 })
  await sleep(300)
  set_light({ id, hue, bri: 10, sat, transitiontime: 10 })
  return Promise.resolve()
}

module.exports = flashdown