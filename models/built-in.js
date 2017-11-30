module.exports = (defineModel) => {
  defineModel('User')
    .tableName('users')
    .attrs({
      id: { type: 'id', primaryKey: true },
      username: 'string',
      email: 'string',
      password: {
        type: 'string',
        private: true
      }
    }, true)
    .build()

  defineModel('Scope')
    .tableName('scopes')
    .attrs({
      id: { type: 'id', primaryKey: true },
      name: 'string',
      currentSequenceId: 'id',
      parentScopeId: 'id',
      version: 'long'
    }, true)
    .build()

  defineModel('ScopeSequence')
    .tableName('scope_sequences')
    .attrs({
      id: { type: 'id', primaryKey: true },
      userId: 'id',
      scopeId: 'id',
      version: 'long'
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
