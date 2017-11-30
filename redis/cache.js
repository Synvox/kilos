const cache = {}

const get = key => cache[key]
const set = (key, value) => cache[key] = value
const getAll = ()=>cache

module.exports = { get, set, getAll }
