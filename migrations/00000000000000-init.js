exports.up = async function (knex, Promise) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements()
    table.string('username').notNullable().unique()
    table.string('email').notNullable().unique()
    table.string('password').notNullable()
  })
  await knex.schema.createTable('scopes', (table) => {
    table.bigIncrements()
    table.string('name')
  })
  await knex.schema.createTable('scope_sequences', (table) => {
    table.bigIncrements()
  })
  await knex.schema.alterTable('scopes', (table) => {
    table.bigInteger('current_sequence_id').references('scope_sequences.id').nullable()
    table.bigInteger('parent_scope_id').references('scopes.id').nullable()
  })
  await knex.schema.createTable('scope_permissions', (table) => {
    table.bigInteger('user_id').references('users.id').notNullable()
    table.bigInteger('scope_id').references('scopes.id').notNullable()
    table.primary(['user_id', 'scope_id'])
    table.unique(['user_id', 'scope_id'])
    table.string('role').notNullable()
  })
  await knex.schema.alterTable('scope_sequences', (table) => {
    table.bigInteger('user_id').references('users.id').notNullable()
    table.bigInteger('scope_id').references('scopes.id').notNullable()
    table.bigInteger('previous_sequence_id').references('scope_sequences.id')
  })
}

exports.down = async function (knex, Promise) {
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('scopes')
  await knex.schema.dropTable('scope_sequences')
  await knex.schema.dropTable('scope_permissions')
}
