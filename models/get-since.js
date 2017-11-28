const { Op } = require('sequelize')
const models = require('./')
const getRole = require('./get-role')

async function getSince({ user, scope, sequenceId }) {
  const { Scope, ScopePermission, ScopeSequence, User, ...userDefined } = models

  const results = (await Promise.all(
    Object.keys(userDefined)
      .map(modelName => userDefined[modelName])
      .map(async (model) => ({
        key: model.tableName,
        item: (await model.findAll({
          where: {
            sequenceId: {
              [Op.and]: {
                [Op.ne]: sequenceId,
                [Op.between]: [Number(sequenceId), Number(scope.currentSequenceId)]
              }
            }
          }
        }))
          .reduce((obj, item) => Object.assign(obj, { [item.id]: item }), {})
      }))
  )).reduce((obj, { key, item }) => Object.assign(obj, { [key]: item }), {})

  return {
    seq: scope.currentSequenceId,
    patch: results
  }
}

module.exports = getSince
