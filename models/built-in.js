module.exports = (defineModel) => {
  defineModel('User')
    .tableName('users')
    .attrs({
      username: 'string',
      email: 'string',
      password: 'string'
    }, true)
    .build()

  defineModel('Scope')
    .tableName('scopes')
    .attrs({
      name: 'string',
      currentSequenceId: 'id',
      parentScopeId: 'id'
    }, true)
    .build()

  defineModel('ScopeSequence')
    .tableName('scope_sequences')
    .attrs({
      userId: 'id',
      scopeId: 'id',
      previousSequenceId: 'id'
    }, true)
    .build()

  defineModel('ScopePermission')
    .tableName('scope_permissions')
    .attrs({
      userId: { type: 'id', primaryKey: true },
      scopeId: { type: 'id', primaryKey: true },
      role: 'string'
    }, true)
    .build()
}
