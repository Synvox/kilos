module.exports = (defineEdge) => setImmediate(() => {
  defineEdge('User', 'user')
    .toMany('ScopePermission', 'permissions')
    .usingKey('userId')
    .build()
  
  defineEdge('ScopeSequence', 'currentSequence')
    .toOne('Scope', 'scope')
    .usingKey('currentSequenceId')
    .build()

  defineEdge('Scope', 'parentScope')
    .toOne('Scope', 'childScope')
    .usingKey('parentScopeId')
    .build()

  defineEdge('Scope', 'sequences')
    .toMany('ScopeSequence', 'scope')
    .usingKey('scopeId')
    .build()

  defineEdge('ScopeSequence', 'nextSequence')
    .toOne('ScopeSequence', 'previousSequence')
    .usingKey('previousSequenceId')
    .build()
})
