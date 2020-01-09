const EventEmitter = require('events')

class Event_hub extends EventEmitter {}

const event_hub = new Event_hub()

module.exports = { event_hub }