const fetch = require('node-fetch')
const get = async ({ url, body, method, headers }) => await fetch(url, { headers, method, body: JSON.stringify(body) }).then(res => res.json())

module.exports = {
    get
}