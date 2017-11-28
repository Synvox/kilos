const Sequelize = require('sequelize')
const Hashids = require('hashids')
const hashids = new Hashids("this is my salt")

const encode = x => String(hashids.encode(x))
const decode = x => Number(hashids.decode(x))

class ID extends Sequelize.BIGINT {}

function walk(val) {
  return val
}

module.exports = {
  ID,
  walk,
  decode,
  encode
}
