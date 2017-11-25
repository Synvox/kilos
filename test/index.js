const {model, action, server} = require('../index.js')

model('Comment', {
  id: Number,
  body: String,
  userId: Number,
  sequenceId: Number
})

model('Article', {
  id: Number,
  body: String,
  userId: Number,
  sequenceId: Number
})

action('CREATE_COMMENT', {
  body: String
}, async ({db, user, sequence, role, payload, Comment})=>{
  if (!user) throw new Error('Not authenticated')
  if (!role) throw new Error('Not within scope')

  return await Comment.create({
    body: payload.body,
    userId: user.id
  })
})

module.exports = server()
