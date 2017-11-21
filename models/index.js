const transformKeys = require('transformkeys')
const {dispatch, actions} = require('../actions')
const {tableize, underscore, camelize} = require('inflection')
const createModel = require('./create-model')

const models = {}

function model(name, keys, private=false) {
  const tableName = tableize(name)
  const def = {
    name,
    tableName,
    private,
    keys
  }

  models[name] = def
  def.model = createModel(def)
}

async function router(fastify, options) {
  const { sinceSequence, getRole, getUser, newSequence, getCurrentUser } = require('../db')
  const { db } = fastify

  fastify.get('/:scopeId/:sequenceId', async (req, reply) => {
    const page = Number(req.query.page || 1)
    const { scopeId, sequenceId } = req.params
    const user = await getCurrentUser({ db, req })
    const role = await getRole({db, scopeId, userId: user.id})

    if (!role) {
      reply.code(401).send()
    }

    const {patch, seq, next} = await sinceSequence({ db, scopeId, sequenceId, models, page })
    return { patch, seq, next}
  })

  fastify.post('/:scopeId/:sequenceId', async (req, reply) => {
    const page = Number(req.query.page || 1)
    const { scopeId, sequenceId } = req.params
    const user = await getCurrentUser({ db, req })
    const role = await getRole({ db, scopeId, userId: user.id })

    if (!role) {
      reply.code(401).send()
    }
    if (!Array.isArray(req.body)) {
      reply.code(400).send()
    }

    const results = []
    for(let action of req.body) {
      try {
        await db.transaction(async db=>{
          const sequence = await newSequence({ db, scopeId, userId: user.id })
          const result = await dispatch(action.type, {
            db,
            user,
            sequence,
            role,
            models,
            payload: action.payload
          })

          if (result.error) {
            throw result
          }

          await db.commit()
          results.push(result)
        })
      } catch(e) {
        results.push(e)
      }
    }

    const { seq, patch, next } = await sinceSequence({ db, scopeId, sequenceId, models, page })

    return {
      seq,
      patch,
      next,
      results
    }
  })
  
  fastify.get('/schema', async (req, reply)=>{
    const validModels = Object.keys(models)
      .filter(key => models[key].keys.sequenceId && models[key].keys.id && !models[key].private)
    return {
      types: validModels.reduce((obj, key) => Object.assign(obj, {
        [key]: serializeModel(models[key])
      }), {}),
      actions: transformKeys(Object.keys(actions).reduce((obj, key) => Object.assign(obj, {
        [key]: {
          type: key,
          payload: serializeSchema(actions[key].schema)
        }
      }), {}))
    }
  })
}

function serializeModel(model) {
  return Object.keys(model.keys).reduce((obj, key)=>Object.assign(obj, {
    [key]: serializeKey(model.keys[key])
  }), {})
}

function serializeSchema(schema) {
  return Object.keys(schema).reduce((obj, key) => Object.assign(obj, {
    [key]: serializeKey(schema[key])
  }), {})
}

function serializeKey(key) {
  if (key.type) {
    const {type, regex} = key
    return Object.assign(serializeKey(type), {
      regex: regex ? regex.toString() : undefined
    })
  }

  if (key === Boolean) return {type: 'boolean'}
  if (key === Number) return {type: 'number'}
  if (key === String) return {type: 'string'}
  // @TODO add more types
  return {type: 'any'}
}

async function verifyModels(db) {
  await Promise.all(Object.keys(models).map(async name=>{
    await verifyModel(db, models[name])
  }))
}

async function verifyModel(db, model) {
  const {name, tableName} = model
  const exists = await db.schema.hasTable(tableName)
  if (!exists) throw new Error(`Table for ${name} (${tableName}) does not exist.`)
  await Promise.all(Object.keys(model.keys).map(async column=>{
    await verifyColumn(db, tableName, column)
  }))
}

async function verifyColumn(db, tableName, column) {
  const columnName = underscore(column)
  const exists = await db.schema.hasColumn(tableName, columnName)
  if (!exists) throw new Error(`Column for ${column} (${tableName}.${columnName}) does not exist.`)
}

module.exports = {model, models, router, verifyModels}

model('Scope', {
  id: Number,
  currentSequenceId: Number
}, true)

model('ScopeSequence', {
  id: Number,
  userId: Number,
  scopeId: Number,
  previousSequenceId: Number
}, true)

model('ScopePermissions', {
  userId: Number,
  scopeId: Number,
  role: String
}, true)
