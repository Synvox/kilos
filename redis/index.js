const ms = require('ms')
const instance = require('./instance')
const getScopes = require('../models/get-scopes')
const logBox = require('../util/log-box')

const subscribedScopeIds = {}

async function subscribe(req, res, { user }) {
  const scopes = await getScopes({ user })
  Object.keys(scopes).forEach(scopeId => {
    const scope = scopes[scopeId]

    const lines = [
      'event: scope-update',
      `id: ${scopeId}-${scope.version}`,
      `data: ${JSON.stringify({ scopeId, version: +scope.version })}`
    ].join('\n') + '\n\n'

    res.write(lines)

    subscribedScopeIds[scopeId] = subscribedScopeIds[scopeId] || new Set()
    subscribedScopeIds[scopeId].add(res)

    req.on('close', () => {
      subscribedScopeIds[scopeId].delete(res)
      if (subscribedScopeIds[scopeId].size === 0) {
        delete subscribedScopeIds[scopeId]
      }
    })
  })

  setInterval(() => {
    const lines = [
      'event: heartbeat',
      `id: beat-${Date.now()}`,
      `data: `
    ].join('\n') + '\n\n'

    res.write(lines)
  }, ms('10s'))
}

function emit({ scopeId, version }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(logBox({ color: 'green', header: 'Emit', body: `scopeId: ${scopeId}\nversion: ${version}` }))
  }
  instance.get().emit('scope-update', { scopeId, version })
}

function receive({ scopeId, version }) {
  if (!subscribedScopeIds[scopeId]) return
  if (process.env.NODE_ENV !== 'production') {
    console.log(logBox({ color: 'green', header: 'Receive', body: `scopeId: ${scopeId}\nversion: ${version}` }))
  }

  for (let res of subscribedScopeIds[scopeId]) {
    const lines = [
      'event: scope-update',
      `id: ${scopeId}-${version}`,
      `data: ${JSON.stringify({ scopeId, version })}`
    ].join('\n') + '\n\n'

    res.write(lines)
  }
}

instance.on('scope-update', receive)

module.exports = { subscribe, emit }
