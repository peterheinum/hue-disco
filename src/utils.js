const fetch = require('node-fetch')
const get = async ({ url, body, method, headers }) => await fetch(url, { headers, method, body: JSON.stringify(body) }).then(res => res.json())

const _request = require('request')
const request = async ({ options, method }) => {
  !options['headers'] && (options['headers'] = auth_headers())
  return new Promise((res, rej) => {
    _request[method](options, (err, response, body) => {
      err && rej(err)
      body && res(body)
    })
  })
}

const is_equal = (a, b) => JSON.stringify(a) == JSON.stringify(b)

module.exports = {
  get,
  request,
  is_equal
}