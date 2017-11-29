const {sequelize} = require('../models/sequelize')
const models = require('../models')
const getRole = require('../models/get-role')
const cache = require('./cache')

class ActionError extends Error {}

async function dispatch(name, payload, context) {
  const { scope, user } = context
  const {ScopeSequence} = models
  const action = cache.get(name)
  const role = await getRole({user, scope})
  const transaction = await sequelize.transaction()

  scope.version = Number(scope.version) + 1

  const sequence = await ScopeSequence.create({
    scopeId: scope.id,
    userId: user.id,
    version: scope.version
  }, {transaction})

  scope.currentSequenceId = sequence.id
  await scope.save({transaction})

  let result = null

  try {
    result = await action.dispatch(payload, { ...context, ...models, role, transaction, sequence, ActionError })
  } catch (e) {
    await transaction.rollback()
    if (e instanceof ActionError) {
      return { error: e.message }
    } else {
      console.log(e)
      return { error: true }
    }
  }

  await transaction.commit()
  return result
}

module.exports = dispatch
