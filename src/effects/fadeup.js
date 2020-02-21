const { set_light, sleep } = require('../utils/helpers')



const fadeup = async ({ id, hue, intensity = 0.8 }) => {
  const bri = 250*intensity
  const sat = 254*intensity

  set_light({ id, hue, bri, sat, transitiontime: 10 })
  await sleep(1000)
  set_light({ id, hue, bri: 10, sat, transitiontime: 3 })
  return Promise.resolve()
}

module.exports = fadeup