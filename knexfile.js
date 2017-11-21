require('dotenv').config()

module.exports = {

  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    searchPath: 'public',
    migrations: {
      tableName: 'migrations'
    }
  },

  staging: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'migrations'
    }
  }
}
