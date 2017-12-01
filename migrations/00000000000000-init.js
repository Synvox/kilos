exports.up = async function (knex, Promise) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').defaultsTo(knex.raw('uuid_generate_v4()')).notNullable().primary()
    table.string('username').notNullable().unique()
    table.string('email').notNullable().unique()
    table.string('first_name').notNullable()
    table.string('last_name').notNullable()
    table.string('password').nullable()
    // "password":
    // $2a$10$qYPecVG9i0N/067.89Jym.lG.7CXw415q39uxY8BHsxh9Rz6gW9V.
  })
  await knex.schema.createTable('user_providers', (table) => {
    table.uuid('id').defaultsTo(knex.raw('uuid_generate_v4()')).notNullable().primary()
    table.uuid('user_id').references('users.id').notNullable()
    table.string('origin').notNullable()
    table.string('foreign_id').notNullable()
    table.string('access_token').notNullable()
    table.string('refresh_token').notNullable()
  })
  await knex.schema.createTable('scopes', (table) => {
    table.uuid('id').defaultsTo(knex.raw('uuid_generate_v4()')).notNullable().primary()
    table.string('name')
  })
  await knex.schema.createTable('scope_sequences', (table) => {
    table.uuid('id').defaultsTo(knex.raw('uuid_generate_v4()')).notNullable().primary()
    table.bigInteger('version').notNullable().defaultsTo(0)
  })
  await knex.schema.alterTable('scopes', (table) => {
    table.uuid('current_sequence_id').references('scope_sequences.id').nullable()
    table.uuid('parent_scope_id').references('scopes.id').nullable()
    table.bigInteger('version').notNullable().defaultsTo(0)
  })
  await knex.schema.createTable('scope_permissions', (table) => {
    table.uuid('user_id').references('users.id').notNullable()
    table.uuid('scope_id').references('scopes.id').notNullable()
    table.primary(['user_id', 'scope_id'])
    table.unique(['user_id', 'scope_id'])
    table.string('role').notNullable()
  })
  await knex.schema.alterTable('scope_sequences', (table) => {
    table.uuid('user_id').references('users.id').notNullable()
    table.uuid('scope_id').references('scopes.id').notNullable()
    table.index(['scope_id'])
    table.unique(['version', 'scope_id'])
  })
}

exports.down = async function (knex, Promise) {
  await knex.schema.dropTable('scope_sequences')
  await knex.schema.dropTable('scopes')
  await knex.schema.dropTable('scope_permissions')
  await knex.schema.dropTable('users')
}
