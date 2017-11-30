let instance = null
const loadedEvents = []

const get = ()=>{
  if (instance === null) throw new Error('Redis not yet initialized')
  return instance
}

const init = (value) => {
  if (instance !== null) throw new Error('Redis already initialized')
  instance = value
  loadedEvents.forEach(({event, fn})=>instance.on(event, fn))
  loadedEvents.length = 0
}

const on = (event, fn)=>{
  if (!instance)
    loadedEvents.push({event, fn})
  else  
    instance.on(event, fn)
}

module.exports = { get, init, on }
