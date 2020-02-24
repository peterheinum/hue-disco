const { setLight, sleep } = require('../utils/helpers')



const fadeup = async ({ id, hue, intensity = 0.8 }) => {
  const bri = 250*intensity
  const sat = 254*intensity

  setLight({ id, hue, bri, sat, transitiontime: 10 })
  await sleep(1000)
  setLight({ id, hue, bri: 10, sat, transitiontime: 3 })
  return Promise.resolve()
}

module.exports = fadeup