'use strict'
require('dotenv').config()
const transformKeys = require('transformkeys')
const { model, models, verifyModels, serializeModel, serializeSchema } = require('./models')
const { sinceSequence, getRole, getUser, newSequence, getCurrentUser, getScopes } = require('./db')
const { dispatch, actions, action } = require('./actions')
const { router, get, post } = require('microrouter')
const micro = require('micro')
const { send, createError, json } = micro

module.exports = {model, action, server}

const db = require('knex')(require('./knexfile')[process.env.SERVER_ENV])

// Required so micro-dev closes connections
process.on('SIGNUSR2', ()=>db.destroy()) // Destroy is for the connection.

function server() {
  setTimeout(()=>verifyModels(db).catch(console.log), 1000)
  return app
}

const app = router(
  get('/', async (req) => {
    const validModels = Object.keys(models)
      .filter(key => models[key].keys.sequenceId && models[key].keys.id && !models[key].private)
      
    const {password, salt, ...user} = await getCurrentUser({ db, req })

    return {
      user: user ? user : null,
      scopes: user ? await getScopes({db, user}) : [],
      types: validModels.reduce((obj, key) => Object.assign(obj, {
        [models[key].tableName]: serializeModel(models[key])
      }), {}),
      actions: transformKeys(Object.keys(actions).reduce((obj, key) => Object.assign(obj, {
        [key]: {
          type: key,
          payload: serializeSchema(actions[key].schema)
        }
      }), {}))
    }
  }),

  get('/:scopeId(/:sequenceId)', async (req) => {
    let { scopeId, sequenceId } = req.params
    scopeId = Number(scopeId)
    sequenceId = sequenceId ? Number(sequenceId) : undefined
    if (isNaN(scopeId) || (sequenceId !== undefined && isNaN(sequenceId))) throw createError(400, 'Bad Params')
    
    const page = Number(req.query.page || 1)
    
    const user = await getCurrentUser({ db, req })
    const role = await getRole({ db, scopeId, userId: user.id })

    if (!role) throw createError(401, 'Unauthorized')

    const { patch, seq, next } = await sinceSequence({ db, scopeId, sequenceId, models, page })

    return {
      seq,
      next,
      patch
    }
  }),

  post('/:scopeId(/:sequenceId)', async (req) => {
    const page = Number(req.query.page || 1)
    const body = await json(req)
    let { scopeId, sequenceId } = req.params
    scopeId = Number(scopeId)
    sequenceId = Number(sequenceId)
    if (isNaN(scopeId) || isNaN(sequenceId)) throw createError(400, 'Bad Params')

    const user = await getCurrentUser({ db, req })
    const role = await getRole({ db, scopeId, userId: user.id })

    if (!role) throw createError(401, 'Unauthorized')
    if (!Array.isArray(body)) throw createError(401, 'Request body is not arraylike.')

    const results = []
    for (let action of body) {
      try {
        await db.transaction(async db => {
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
      } catch (e) {
        console.log('cancel', e)
        results.push(e)
      }
    }

    const { seq, patch, next } = await sinceSequence({ db, scopeId, sequenceId, models, page })

    return {
      seq,
      next,
      results,
      patch
    }
  })
)
