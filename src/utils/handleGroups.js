const { get, baseHueUrl, objToArrayWithKeyAsId } = require('./helpers')

const HUE_HUB = '192.168.1.8'
const API_KEY = 'oyjHEB1MhokwXXhauN-fgtdTgKBTAKgPawaySIY6'
const _baseHueUrl = () => `http://${HUE_HUB}/api/${API_KEY}`

const createGroup = async lights => {
  const hueClientKey = process.env.HUE_CLIENT_KEY
  const hueClientSecret = Buffer.from(process.env.HUE_CLIENT_SECRET, 'hex')
  
  const method = 'POST'
  const url = baseHueUrl(hueClientKey)

  const body = {
    "name": "R o o m b a",
    "type": "Entertainment",
    "lights": [lights.map(light => light.id)],
    "class": "DiscoGroup"
  }

  try {
    const res = await get({ url, body, method })
    console.log(res)
  } catch (error) {
    return error
  }
}

const editGroup = async (id, lights) => {
  const hueClientKey = process.env.HUE_CLIENT_KEY
  
  const method = 'PUT'
  const url = `${baseHueUrl(hueClientKey)}/${id}`

  const body = {
    "lights": [lights.map(light => light.id)],
  }

  try {
    const res = await get({ url, body, method })
    console.log(res)
  } catch (error) {
    return error
  }
}

const getGroups = async () => {
  const url = `${_baseHueUrl()}/groups`
  const response = await get({ url })
  return objToArrayWithKeyAsId(response).filter(group => group.type == 'Entertainment')
}

module.exports = { createGroup, getGroups, editGroup }