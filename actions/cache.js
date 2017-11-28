const cache = {}

const get = key=>cache[key]
const set = (key, value)=>cache[key] = value

module.exports = { get, set }
