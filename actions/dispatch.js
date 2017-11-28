const {sequelize} = require('../models/sequelize')
const models = require('../models')
const getRole = require('../models/get-role')
const cache = require('./cache')

async function dispatch(name, payload, context) {
  const { scope, user } = context
  const {ScopeSequence} = models
  const action = cache.get(name)
  const role = await getRole({user, scope})
  const transaction = await sequelize.transaction()

  const sequence = await ScopeSequence.create({
    scopeId: scope.id,
    userId: user.id,
    previousSequenceId: scope.currentSequenceId
  }, {transaction})

  scope.currentSequenceId = sequence.id
  await scope.save({transaction})

  try {
    const result = await action.dispatch(payload, {...context, ...models, role, transaction, sequence })
    await transaction.commit()
    return result
  } catch (e) {
    console.log(e)
    await transaction.rollback()
    return { error: e.message }
  }
}

module.exports = dispatch
