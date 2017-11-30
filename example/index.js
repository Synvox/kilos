require('dotenv').config()

const express = require('express')
const boxen = require('boxen')
const kilos = require('../')

const app = express()

app.use('/', kilos(
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
    .resolver(async ({ body }, {
      Comment,
      sequence,
      user,
      role,
      transaction,
      ActionError
    }) => {
      if (!user) throw new ActionError('No User')
      if (!role) throw new ActionError('No Role')

      const comment = await sequence.createComment({
        body,
        userId: user.id
      }, { transaction })

      return comment
    }),

  kilos.redis({
    url: process.env.REDIS_URL
  })
))

app.listen(process.env.PORT, () => {
  if (app.get('env') === 'development') {
    console.log('\x1Bc')
  }

  console.log(boxen(`Started on port ${process.env.PORT}`, {
    padding: 2,
    borderColor: 'blue'
  }))
})
