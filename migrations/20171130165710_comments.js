
exports.up = async (knex, Promise)=>{
  await knex.schema.createTable('comments', (table) => {
    table.uuid('id').defaultsTo(knex.raw('uuid_generate_v4()')).notNullable().primary()
    table.uuid('user_id').references('users.id').notNullable()
    table.uuid('sequence_id').references('scope_sequences.id').notNullable()
    table.string('body').notNullable().defaultsTo('')
    table.bool('deleted').notNullable().defaultsTo(false)
  })
}

exports.down = async (knex, Promise)=>{
  await knex.schema.dropTable('comments')
}
