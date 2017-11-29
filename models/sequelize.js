require('dotenv').config()
const Sequelize = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  operatorsAliases: false,
  logging: x=>console.log(x),
  define: {
    timestamps: false,
    underscored: true
  }
})

module.exports = {Sequelize, sequelize}
