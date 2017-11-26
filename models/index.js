const transformKeys = require('transformkeys')
const {tableize, underscore, camelize} = require('inflection')
const createModel = require('./create-model')

const models = {}
module.exports = { model, models, verifyModels, serializeModel, serializeSchema }

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

function serializeModel(model) {
  return {
    name: model.name,
    properties: Object.keys(model.keys).reduce((obj, key) => Object.assign(obj, {
      [key]: serializeKey(model.keys[key])
    }), {})
  }
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

  if (key === Boolean) return { type: 'boolean' }
  if (key === Number) return { type: 'number' }
  if (key === String) return { type: 'string' }
  // @TODO add more types
  return { type: 'any' }
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
