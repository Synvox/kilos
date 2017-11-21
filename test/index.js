const {model, action, start} = require('../index.js')

model('Comment', {
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
  // throw new Error('Not within scope')

  // return (await db('comments').insert({
  //   'body': payload.body,
  //   'user_id': user.id,
  //   'sequence_id': sequence.id
  // }).returning('*'))[0]

  return await Comment.create({
    body: payload.body,
    userId: user.id
  })
})

start().then((fastify)=>{
  console.log(`server listening on ${fastify.server.address().port}`)
}).catch(x=>{
  console.error(x)
})
