const kilos = require('../')
const models = require('../models')
const getSince = require('../models/get-since')
const getRole = require('../models/get-role')
const dispatch = require('../actions/dispatch')

module.exports = kilos.createServer(
  kilos.model('Comment')
    .tableName('comments')
    .attrs({
      body: 'string',
      userId: 'id'
    }),

  kilos.edge('User', 'user')
    .toMany('Comment', 'comments')
    .usingKey('userId'),

  kilos.action('createComment')
    .input({ body: 'string' })
    .output('Comment')
    .resolver(async ({ body }, { Comment, sequence, user, role, transaction }) => {
      if (!user) throw new Error('No User')
      if (!role) throw new Error('No Role')

      const comment = await sequence.createComment({
        body,
        userId: user.id
      }, { transaction })

      return comment
    })
)
