class Action {
  constructor({ name, input = null, output = null, resolver }) {
    if (!name) throw new Error('Name is required')
    if (!resolver) throw new Error('Function is required')

    this.name = name
    this.input = input
    this.output = output
    this.resolver = resolver
  }
  serialize() {
    return { name: this.name }
  }
  async dispatch(payload, cxt) {
    return await this.resolver(payload, cxt)
  }
}

module.exports = Action
