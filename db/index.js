const {camelize} = require('inflection')
const transformKeys = require('transformkeys')
const jwt = require('jsonwebtoken')
const keyCast = require('../models/key-cast')

module.exports = { sinceSequence, getRole, getUser, newSequence, getCurrentUser, getScopes}

const toModel = (x) => x ? transformKeys(x) : x
const flatten = (arr) => arr.reduce((flat, arr) => flat.concat(Array.isArray(arr) ? flatten(arr) : arr), [])

async function sinceSequence({db, scopeId, sequenceId, models, page}) {
  const scope = toModel(await db('scopes').where({id: scopeId}).first())
  const limit = 500
  const offset = (page - 1) * limit
  let patch = undefined
  let hasNext = false
  
  if (sequenceId){
    patch = {}

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
        .andWhereNot('sequence_id', sequenceId)
        .andWhereBetween('sequence_id', [sequenceId, scope.currentSequenceId])
        .count())

      const count = countResult[0].count

      if (count - (page - 1) * limit > limit) {
        hasNext = true
      }

      const results = toModel(
        await db(models[name].tableName)
          .innerJoin('scope_sequences', `${models[name].tableName}.sequence_id`, `scope_sequences.id`)
          .where('scope_id', scopeId)
          .andWhereNot('sequence_id', sequenceId)
          .andWhereBetween('sequence_id', [sequenceId, scope.currentSequenceId])
          .offset(offset)
          .limit(limit)
      )

      results.map(toModel).forEach(result=>{
        patch[mappedName][result.id] = Object.keys(model.keys)
          .map(key => ({ key, item: keyCast(model.keys[key])(result[key])}))
          .reduce((obj, {key, item})=>Object.assign(obj, {[key]: item}), {})
      })
    }))
  }

  return {
    seq: scope.currentSequenceId,
    patch,
    next: !patch
      ? undefined
      : hasNext
        ? `${process.env.PUBLIC_URL}/${scopeId}/${sequenceId}?page=${page + 1}`
        : null
  }
}

async function getRole({db, scopeId, userId}) {
  const permission = await db('scope_permissions').where({
    'scope_id': scopeId,
    'user_id': userId
  }).first()

  if (permission)
    return permission.role

  const scope = toModel(await db('scopes').where({
    'id': scopeId
  }).first())

  return scope.parentScopeId === null
    ? null
    : await getRole({ db, scopeId: scope.parentScopeId, userId })
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

async function getScopes({db, user}) {
  const permissions = await db('scope_permissions').where({
    'user_id': user.id
  })

  const scopes = flatten(await Promise.all(permissions.map(toModel).map(async ({scopeId, role})=>{
    const scope = toModel(await db('scopes').where({ id: scopeId }).first())
    const children = await getChildScopes({db, scope, user, role})
    return [{id: scopeId, role, seq: scope.currentSequenceId, isPrimary: true}, ...children]
  }))).reduce((obj, { id, role, seq, isPrimary }) => {
    if (!obj[id] || isPrimary)
      Object.assign(obj, { [id]: { id, role, seq } })
    return obj
  }, {})

  return scopes
}

async function getChildScopes({db, scope, role, user}) {
  const childScopes = (await db('scopes').where({ parent_scope_id: scope.id })).map(toModel)

  const defs = await Promise.all(childScopes.map(async (scope)=>{
    const { id, seq } = scope

    const children = await getChildScopes({ db, scope, role, user })
    return [{ id, role, seq: scope.currentSequenceId }, ...children]
  }))

  return defs
}
