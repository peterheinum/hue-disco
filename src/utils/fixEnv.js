module.exports = () => {
  const fs = require('fs')
  const env = fs.readFileSync(__dirname + '/../../.env').toString()
  const onlyValue = str => str.split('=')[1]
  const [API_KEY,
    HUE_CLIENT_KEY,
    HUE_CLIENT_SECRET,
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
  ] = env.split('\n').map(onlyValue)
  
  process.env.API_KEY = API_KEY
  process.env.HUE_CLIENT_KEY = HUE_CLIENT_KEY
  process.env.HUE_CLIENT_SECRET = HUE_CLIENT_SECRET
  process.env.SPOTIFY_CLIENT_ID = SPOTIFY_CLIENT_ID
  process.env.SPOTIFY_CLIENT_SECRET = SPOTIFY_CLIENT_SECRET
  
  console.log('Fix env has made it possible for this')
  console.log(process.env.API_KEY)
  console.log(process.env.HUE_CLIENT_KEY)
  console.log(process.env.HUE_CLIENT_SECRET)
  console.log(process.env.SPOTIFY_CLIENT_ID)
  console.log(process.env.SPOTIFY_CLIENT_SECRET)
  return Promise.resolve()  
}