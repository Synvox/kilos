const Sequelize = require('sequelize')

module.exports = (defineModel) => {
  defineModel('User')
    .tableName('users')
    .attrs({
      id: { type: 'id', primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      username: 'string',
      firstName: {
        field: 'first_name',
        type: 'string'
      },
      lastName: {
        field: 'last_name',
        type: 'string'
      },
      email: 'string',
      password: 'string'
    }, true)
    .build()

  defineModel('UserProvider')
    .tableName('user_providers')
    .attrs({
      id: {
        type: 'id',
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        field: 'user_id',
        type: 'id'
      },
      origin: {
        field: 'origin',
        type: 'string'
      },
      foreignId: {
        field: 'foreign_id',
        type: 'string'
      },
      accessToken: {
        field: 'access_token',
        type: 'string'
      },
      refreshToken: {
        field: 'refresh_token',
        type: 'string'
      }
    }, true)
    .build()

  defineModel('Scope')
    .tableName('scopes')
    .attrs({
      id: { type: 'id', primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name: 'string',
      currentSequenceId: 'id',
      parentScopeId: 'id',
      version: 'long'
    }, true)
    .build()

  defineModel('ScopeSequence')
    .tableName('scope_sequences')
    .attrs({
      id: { type: 'id', primaryKey: true, defaultValue: Sequelize.UUIDV4 },
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
