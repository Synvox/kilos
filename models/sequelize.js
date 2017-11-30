const Sequelize = require('sequelize')
const logBox = require('../util/log-box')

const logger = process.env.NODE_ENV === 'production' ? false : (() => {
  const sqlFormatter = require("sql-formatter")
  const prefix = '│ '
  return (x) => {
    try {
      const header = x.substring(0, x.indexOf('):') + 1)
      const sql = sqlFormatter.format(x.substring(x.indexOf('):') + 3))
      
      console.log(logBox({header, body: sql}))
    } catch (e) {
      console.error(e)
    }
  }
})()

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  operatorsAliases: false,
  logging: logger,
  define: {
    timestamps: false,
    underscored: true
  }
})

module.exports = { Sequelize, sequelize }
