'use strict'
require('dotenv').config()

const { model, router, verifyModels } = require('./models')
const { action } = require('./actions')
module.exports = {model, action, start}

function start() {
  const db = require('knex')(require('./knexfile')[process.env.SERVER_ENV])
  const fastify = require('fastify')({logger: true})

  fastify.decorate('db', db)
  fastify.register(router)
  // fastify.register(require('./routes'))

  return new Promise((resolve, reject)=>{
    verifyModels(db).then(()=>{
      fastify.listen(8000, err=>{
        if (err) return reject(err)
        resolve(fastify)
      })
    }).catch(reject)
  })
}
