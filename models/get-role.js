const models = require('./')

async function getRole({ user, scope }) {
  const { Scope, ScopePermission } = models

  const permission = await ScopePermission.find({
    where: {
      userId: user.id,
      scopeId: scope.id
    }
  })

  if (permission)
    return permission.role

  if (scope.parentScopeId) {
    return await getRole({
      user,
      scopeId: await Scope.findById(scope.parentScopeId)
    })
  }

  return null
}

module.exports = getRole
