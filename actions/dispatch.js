const {sequelize} = require('../models/sequelize')
const models = require('../models')
const getRole = require('../models/get-role')
const cache = require('./cache')
const logBox = require('../util/log-box')
const { emit } = require('../redis')

class ActionError extends Error {}

async function dispatch(name, payload, context) {
  const { scope, user } = context
  const {ScopeSequence} = models
  const action = cache.get(name)

  if (process.env.NODE_ENV !== 'PRODUCTION') {
    console.log(logBox({header: `Dispatching (${name})`, body: JSON.stringify(payload, null, 2), color:'blue'}))
  }

  const transaction = await sequelize.transaction()
  const role = await getRole({ user, scope })

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
    if (e instanceof ActionError) {
      if (process.env.NODE_ENV !== 'PRODUCTION') {
        console.log(logBox({ header: `User error: '${name}'`, body: e.stack, color: 'red' }))
      }
      await transaction.rollback()
      return { error: e.message }
    } else {
      await transaction.rollback()
      return { error: e }
    }
  }

  await transaction.commit()
  if (process.env.NODE_ENV !== 'PRODUCTION') {
    console.log(logBox({ header: `Complete: (${name})`, body: JSON.stringify(result, null, 2), color: 'blue' }))
  }

  emit({scopeId: scope.id, version: scope.version})

  return result
}

module.exports = dispatch
