const express = require('express')
const helmet = require('helmet')
const boxen = require('boxen')
const chalk = require('chalk')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const graphqlHTTP = require('express-graphql')

const models = require('./models')
const {getUser, getJWT} = require('./models/auth')
const getScopes = require('./models/get-scopes')
const getSince = require('./models/get-since')
const getRole = require('./models/get-role')
const dispatch = require('./actions/dispatch')
const {subscribe} = require('./redis')
const {compile} = require('./graph')

const app = express()

module.exports = (...things) => {
  things.forEach(x => x.build())
  return app
}

app.use(express.json())
app.use(cookieParser())
app.use(helmet())
app.use(cors())
app.use((req, res, next)=>{
  res.setHeader('X-Powered-By', 'Synvox')
  next()
})

if (app.get('env') === 'development') {
  const jsome = require('jsome')
  let reqCount = 0
  jsome.colors = {
    num: 'cyan',
    str: 'green',
    bool: 'red',
    regex: 'blue',
    undef: 'grey',
    null: 'grey',
    attr: 'reset',
    quot: 'reset',
    punc: 'reset',
    brack: 'reset'
  }

  app.use((req, res, next)=>{
    const reqNum = ++reqCount
    let end = res.end
    let startMs = Date.now()
    console.log(chalk.blue(`► (#${reqNum}) ${chalk.bold(req.method)} ${req.url}\n`))

    if (Object.keys(req.params).length > 0) {
      console.log(chalk.yellow('Params:\n'))
      jsome(req.params)
      console.log('\n')
    }

    if (Object.keys(req.query).length > 0) {
      console.log(chalk.yellow('Query:\n'))
      jsome(req.query)
      console.log('\n')
    }

    if (req.headers['content-length'] > 0) {
      console.log(chalk.yellow('Body:\n'))
      jsome(req.body)
      console.log('\n')
    }

    res.end = (chunk, encoding, callback)=>{
      res.end = end
      let endMs = Date.now()

      let color = 'blue'
      if (res.statusCode >= 400) color = 'yellow'
      if (res.statusCode >= 500) color = 'red'
      
      console.log(chalk[color](
        `\n◄ (#${reqNum}) ${chalk.bold(res.statusCode)} [+${endMs - startMs}ms]\n`
      ))

      if (chunk.length < 1000) {
        try {
          const str = JSON.parse(chunk)
          jsome(str)
        } catch (e) {
          console.log(chunk)
          console.log('\n')
        }
      } else  {
        console.log(chalk.yellow(`Not showing output because it's too large`))
      }

      if (res.__error)
        res.__error()

      console.log(chalk.grey(`${'—'.repeat(process.stdout.columns)}\n`))

      return res.end(chunk, encoding, callback)
    }
    next()
  })
}

Object.assign(module.exports, {
  action: require('./actions/define-action'),
  model: require('./models/define-model'),
  edge: require('./edges/define-edge'),
  redis: require('./redis/define-redis')
})

const wrap = fn => (req, res, next) => fn(req, res, next).then(() => { }).catch(next)

const createError = (status, message)=>{
  const err = new Error(message)
  err.status = status
  return err
}

app.get('/', wrap(async (req, res) => {
  const user = await getUser({ req })
  if (!user) throw createError(401, 'Not Authenticated')

  const {
    password,
    ...safeUser
  } = user.dataValues

  res.send({
    user: safeUser,
    scopes: await getScopes({ user })
  })
}))

{
  let schema = null
  app.use('/graphql', wrap(async (req, res, next) => {
    const user = await getUser({ req })
    if (!user) throw createError(401)

    const scopes = await getScopes({ user })

    if (schema === null) schema = compile()

    graphqlHTTP({
      schema: schema,
      graphiql: process.env.NODE_ENV !== 'production',
      context: {user, scopes, cache:{}}
    })(req, res, next)
  }))
}

app.get('/stream', wrap(async (req, res) => {
  const user = await getUser({ req })
  if (!user) throw createError(401, 'Not Authenticated')

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.writeHead(200)

  await subscribe(req, res, {user})
}))

app.post('/login', wrap(async (req, res) => {
  const {username, password} = req.body
  if (!username || !password) throw createError(400, '')
  const jwt = await getJWT({username, password})
  res.cookie('authorization', jwt)
  res.send({jwt})
}))

app.get('/:scopeId/:version', wrap(async (req, res) => {
  const { Scope } = models
  const { scopeId, version } = req.params

  if (isNaN(Number(version))) throw createError(400,'Version must be numeric')

  const user = await getUser({ req })
  if (!user) throw createError(401, '')

  const scope = await Scope.find({ where: { id: scopeId } })
  if (!user) throw createError(404, '')

  const role = await getRole({ user, scope })
  if (!user) throw createError(401, '')

  const { version: newVersion, patch } = await getSince({ user, scope, version })

  res.send({
    version: newVersion,
    patch
  })
}))

app.post('/:scopeId/:version', wrap(async (req, res) => {
  const { Scope } = models

  const { scopeId, version } = req.params
  if (isNaN(Number(version))) throw createError(400)

  const {body} = req

  const user = await getUser({ req })
  if (!user) throw createError(401, '')

  const scope = await Scope.find({ where: { id: scopeId } })
  if (!user) throw createError(404, '')

  const role = await getRole({ user, scope })
  if (!user) throw createError(401, '')

  const results = []
  for (let action of body) {
    const result = await dispatch(action.type, action.payload, { user, role, scope })
    if (result instanceof Error)
      throw result
    results.push(result)
  }

  const { version: newVersion, patch } = await getSince({ user, scope, version })

  res.send({
    version: newVersion,
    results,
    patch
  })
}))

if (app.get('env') === 'development') {
  const PrettyError = require('pretty-error')
  const pe = new PrettyError()
  pe.skipNodeFiles()
  pe.skipPackage('express')
  app.use(function (err, req, res, next) {
    res.__error = () => setImmediate(()=>console.log('\n',pe.render(err)))
    res.status(err.status || 500)
    res.send({
      error: err.message
    })
  })
} else {
  app.use((err, req, res, next) => {
    console.log(chalk.red(err))
    res.sendStatus(err.status || 500)
  })
}
