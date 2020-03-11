const { calculateXY } = require('./rgbToXY')

const getBytes = val => {
  const hexVal = Math.round(val * 0xffff)
  const secondByte = hexVal % 0xff
  const firstByte = (hexVal - secondByte) / 0xff
  return [firstByte, secondByte]
}

const convertRgbToBytes = (...args) => calculateXY(...args).map(cord => getBytes(cord))

module.exports = convertRgbToBytes