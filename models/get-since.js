const { Op } = require('sequelize')
const models = require('./')
const getRole = require('./get-role')

async function getSince({ user, scope, version }) {
  const { Scope, ScopePermission, ScopeSequence, User, UserProvider, ...userDefined } = models

  const sequences = await ScopeSequence.findAll({where: {
    scopeId: scope.id,
    version: {[Op.and]: {
      [Op.ne]: version,
      [Op.between]: [Number(version), Number(scope.version)]
    }}
  }})

  const sequenceIds = sequences.map(x=>x.id)

  const results = (await Promise.all(
    Object.keys(userDefined)
      .map(modelName => userDefined[modelName])
      .map(async (model) => ({
        key: model.tableName,
        item: sequenceIds.length === 0 ? {} : (await model.findAll({
          where: {
            sequenceId: {
              [Op.in]: sequenceIds
            }
          }
        }))
          .reduce((obj, item) => Object.assign(obj, { [item.id]: item }), {})
      }))
  )).reduce((obj, { key, item }) => Object.assign(obj, { [key]: item }), {})

  return {
    version: scope.version,
    patch: results
  }
}

module.exports = getSince
