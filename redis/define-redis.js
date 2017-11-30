const NRP = require('node-redis-pubsub')
const cache = require('./cache')
const instance = require('./instance')

function defineRedis(config) {
  return new RedisBuilder(config)
}

class RedisBuilder {
  constructor(config = {url: process.env.REDIS_URL}) {
    this.config = config
  }
  build() {
    const nrp = new NRP(this.config)
    instance.init(nrp)
  }
}

module.exports = defineRedis
