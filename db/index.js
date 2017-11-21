const {camelize} = require('inflection')
const transformKeys = require('transformkeys')
const jwt = require('jsonwebtoken')

module.exports = { sinceSequence, getRole, getUser, newSequence, getCurrentUser}

const toModel = (x) => x ? transformKeys(x) : x

async function sinceSequence({db, scopeId, sequenceId, models, page}) {
  const scope = toModel(await db('scopes').where({id: scopeId}).first())
  const limit = 100
  const offset = (page - 1) * limit
  const patch = {}
  let hasNext = false
  
  const validModels = Object.keys(models)
    .filter(key=>models[key].keys.sequenceId && models[key].keys.id && !models[key].private)

  const nameMap = {}
  validModels.forEach(key=>{
    const name = camelize(models[key].tableName, true)
    nameMap[models[key].tableName] = name
    patch[name] = {}
  })

  await Promise.all(validModels.map(async name=>{
    const model = models[name]
    const mappedName = nameMap[models[name].tableName]

    const countResult = (await db(models[name].tableName)
      .innerJoin('scope_sequences', `${models[name].tableName}.sequence_id`, `scope_sequences.id`)
      .where('scope_id', scopeId)
      .whereBetween('sequence_id', [sequenceId, scope.currentSequenceId])
      .count())

    const count = countResult[0].count

    if (count - page * limit > limit)
      hasNext = true

    const results = toModel(
      await db(models[name].tableName)
        .innerJoin('scope_sequences', `${models[name].tableName}.sequence_id`, `scope_sequences.id`)
        .where('scope_id', scopeId)
        .whereBetween('sequence_id', [sequenceId, scope.currentSequenceId])
        .offset(offset)
        .limit(limit)
    )

    results.map(toModel).forEach(result=>{
      patch[mappedName][result.id] = Object.keys(model.keys)
        .map(key=>({key, item: model.keys[key](result[key])}))
        .reduce((obj, {key, item})=>Object.assign(obj, {[key]: item}), {})
    })
  }))

  return {
    seq: scope.currentSequenceId,
    patch,
    next: hasNext ? `${process.env.PUBLIC_URL}/${scopeId}/${sequenceId}?page=${page + 1}` : null
  }
}

async function getRole({db, scopeId, userId}) {
  const permission = await db('scope_permissions').where({
    'scope_id': scopeId,
    'user_id': userId
  }).first()

  return permission ? permission.role : null
}

async function getUser({db, userId}) {
  const user = await db('users').where({
    'id': userId
  }).first()

  return toModel(user)
}

async function newSequence({db, scopeId, userId}) {
  const scope = toModel(await db('scopes').where({
    'id': scopeId
  }).first())

  const sequence = toModel(await db('scope_sequences').insert({
    'user_id': userId,
    'scope_id': scopeId,
    'previous_sequence_id': scope.currentSequenceId
  }).returning('*'))[0]

  await db('scopes')
    .update('current_sequence_id', sequence.id)
    .where({id: scopeId})

  return sequence
}

function getCurrentUser({db, req}) {
  return new Promise((resolve, reject)=>{
    jwt.verify(req.headers['authorization'].substring('Bearer '.length), process.env.JWT_SECRET, (err, decoded)=>{
      if (err) return reject(err)
      getUser({db, userId: decoded.id}).then(resolve).catch(reject)
    })
  })
}
