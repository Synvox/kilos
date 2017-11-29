require('dotenv').config()

const models = require('./models')
const {getUser, getJWT} = require('./models/auth')
const getScopes = require('./models/get-scopes')
const getSince = require('./models/get-since')
const getRole = require('./models/get-role')
const dispatch = require('./actions/dispatch')
const { router, get, post } = require('microrouter')
const { send, createError, json } = require('micro')

module.exports = {
  action: require('./actions/define-action'),
  model: require('./models/define-model'),
  edge: require('./edges/define-edge'),
  createServer: (...things) => {
    things.forEach(x=>x.build())
    return app
  }
}

const app = router(
  get('/', async req => {
    const user = await getUser({ req })
    if (!user) return null

    const {
      password,
      salt,
      ...safeUser
    } = user.dataValues

    return {
      user: safeUser,
      scopes: await getScopes({ user })
    }
  }),

  post('/login', async req => {
    const {username, password} = await json(req)
    if (!username || !password) throw createError(400, '')
    const jwt = await getJWT({username, password})
    return {jwt}
  }),

  get('/:scopeId/:version', async req => {
    const { Scope } = models

    const { scopeId, version } = req.params

    const user = await getUser({ req })
    if (!user) throw createError(401, '')

    const scope = await Scope.find({ where: { id: scopeId } })
    if (!user) throw createError(404, '')

    const role = await getRole({ user, scope })
    if (!user) throw createError(401, '')

    const { seq, patch } = await getSince({ user, scope, version })

    return {
      seq,
      patch
    }
  }),

  post('/:scopeId/:version', async req => {
    const { Scope } = models

    const { scopeId, version } = req.params
    const body = await json(req)

    const user = await getUser({ req })
    if (!user) throw createError(401, '')

    const scope = await Scope.find({ where: { id: scopeId } })
    if (!user) throw createError(404, '')

    const role = await getRole({ user, scope })
    if (!user) throw createError(401, '')

    const results = []
    for (let action of body) {
      results.push(await dispatch(action.type, action.payload, { user, role, scope }))
    }

    const { seq, patch } = await getSince({ user, scope, version })

    return {
      seq,
      results,
      patch
    }
  })
)
