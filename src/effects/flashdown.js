const { setLight, sleep } = require('../utils/helpers')



const flashdown = async ({ id, hue, intensity = 0.8 }) => {
  const bri = 250*intensity
  const sat = 254*intensity

  setLight({ id, hue, bri, sat, transitiontime: 0 })
  await sleep(300)
  setLight({ id, hue, bri: 10, sat, transitiontime: 10 })
  return Promise.resolve()
}

module.exports = flashdown