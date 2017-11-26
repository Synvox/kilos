module.exports = keyCast

function keyCast(key) {
  if (typeof key === 'function') {
    return key
  } else if (key.type) {
    return key.regex
      ? x => {
        if (typeof x === 'object')
          throw new Error(`Value does is not primitive.`)

        x = String(x)

        if (!key.regex.test(x))
          throw new Error(key.error || `Value does not match regex: ${key.regex.toString()}`)

        return x
      }
      : keyCast(key.type)
  }

  return x => x
}
