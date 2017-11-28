const cache = require('./cache')
const Action = require('./action')

module.exports = (name) => new ActionBuilder(name)

class ActionBuilder {
  constructor(name='') {
    this.name = name
  }
  name(name) {
    this.name = name
    return this
  }
  input(input) {
    this.input = input
    return this
  }
  output(output) {
    this.output = output
    return this
  }
  resolver(resolver) {
    this.resolver = resolver
    return this
  }
  build() {
    const action = new Action(this)
    cache.set(this.name, action)
    return action
  }
}
