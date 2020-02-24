const EventEmitter = require('events')

class Event_Hub extends EventEmitter {}

const eventHub = new Event_Hub()

module.exports = { eventHub }