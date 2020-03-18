const { get, baseHueUrl, objToArrayWithKeyAsId } = require('./helpers')

const hueClientKey = process.env.HUE_CLIENT_KEY

const baseGroupUrl = `${baseHueUrl(hueClientKey)}/groups`


const createGroup = async lights => {
  const method = 'POST'
  const url = baseGroupUrl

  const body = {
    "name": "R o o m b a",
    "type": "Entertainment",
    "lights": [lights.map(light => light.id || light)],
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
  const method = 'PUT'
  const url = `${baseGroupUrl}/${id}`

  const body = {
    "lights": [...lights],
  }

  try {
    const res = await get({ url, body, method })
    return res
  } catch (error) {
    return error
  }
}

const onlyEnterTainment = arr => arr.filter(group => group.type == 'Entertainment')

const getGroups = () => get({ url: baseGroupUrl })
  .then(objToArrayWithKeyAsId)
  .then(onlyEnterTainment)


module.exports = { createGroup, getGroups, editGroup }