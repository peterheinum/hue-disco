//Spotify authentication
const auth = {
  access_token: '',
  refresh_token: ''
}
const assign_auth = object => Object.assign(auth, object)

const active_interval = {
  bars: {},
  beats: {},
  tatums: {},
  sections: {},
  segments: {},
}
const assign_active_interval = (type, value) => active_interval[type] = value

module.exports = { 
  auth,
  assign_auth,
  active_interval,
  assign_active_interval
}