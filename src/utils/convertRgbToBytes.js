const getBytes = val => {
  const hexVal = Math.round(val * 0xffff)
  const secondByte = hexVal % 0xff
  const firstByte = (hexVal - secondByte) / 0xff
  return [firstByte, secondByte]
}

// const convertRgbToBytes = (...args) => calculateXY(...args).map(cord => getBytes(cord))
const convertToXY = (red, green, blue) => {
  //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
  red =
    red > 0.04045 ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : red / 12.92
  green =
    green > 0.04045 ?
    Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) :
    green / 12.92
  blue =
    blue > 0.04045 ?
    Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) :
    blue / 12.92

  //RGB values to XYZ using the Wide RGB D65 conversion formula
  const X = red * 0.664511 + green * 0.154324 + blue * 0.162028
  const Y = red * 0.283881 + green * 0.668433 + blue * 0.047685
  const Z = red * 0.000088 + green * 0.07231 + blue * 0.986039

  //Calculate the xy values from the XYZ values
  let x = (X / (X + Y + Z)).toFixed(4)
  let y = (Y / (X + Y + Z)).toFixed(4)

  if (isNaN(x)) x = 0

  if (isNaN(y)) y = 0

  return [x, y]
}

const convertRgbToBytes = (...args) => {
  const xy = convertToXY(...args)
  return xy.map(cord => getBytes(cord))
}

module.exports = convertRgbToBytes