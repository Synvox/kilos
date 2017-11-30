const models = require('./')

const flatten = (arr) => arr.reduce((flat, arr) => flat.concat(Array.isArray(arr) ? flatten(arr) : arr), [])

async function getScopes({ user }) {
  const { Scope, ScopePermission } = models

  const permissions = await ScopePermission.findAll({
    where: {
      userId: user.id
    }
  })

  const scopes = flatten(await Promise.all(permissions.map(async ({ scopeId, role }) => {
    const scope = await Scope.find({ where: { id: scopeId } })
    const children = await getChildScopes({ scope, user, role })
    return [{ id: scopeId, role, version: scope.version, isPrimary: true }, ...children]
  }))).reduce((obj, { id, role, version, isPrimary }) => {
    if (!obj[id] || isPrimary)
      Object.assign(obj, { [id]: { id, role, version } })
    return obj
  }, {})

  return scopes
}

async function getChildScopes({ scope, role, user }) {
  const { Scope } = models
  const childScopes = await Scope.findAll({ where: { parentScopeId: scope.id } })

  const defs = await Promise.all(childScopes.map(async (scope) => {
    const { id, version } = scope

    const children = await getChildScopes({ scope, role, user })
    return [{ id, role, version: version }, ...children]
  }))

  return defs
}

module.exports = getScopes
