const { get: getModel } = require('../models/cache')
const { reopenType } = require('../graph')

function defineEdge(...args) {
  return new EdgeBuilder(...args)
}

const lowercaseFirst = x=>x[0].toLowerCase() + x.substring(1)

class EdgeBuilder {
  constructor(localModelName, localKey) {
    this.type = null
    this.localModelName = localModelName
    this.localKey = localKey
  }
  toMany(remoteModelName, remoteKey, key) {
    this.type = 'toMany'
    this.remoteModelName = remoteModelName
    this.remoteKey = remoteKey
    this.key = key
    return this
  }
  toOne(remoteModelName, remoteKey, key) {
    this.type = 'toOne'
    this.remoteModelName = remoteModelName
    this.remoteKey = remoteKey
    this.key = key
    return this
  }
  usingKey(key) {
    this.key = key
    return this
  }
  build() {
    const localModel = getModel(this.localModelName)
    const remoteModel = getModel(this.remoteModelName)

    if (!localModel) throw new Error(`Model ${this.localModelName} does not exist.`)
    if (!remoteModel) throw new Error(`Model ${this.remoteModelName} does not exist.`)

    return {
      toMany: () => {
        localModel.hasMany(remoteModel, {
          as: this.remoteKey,
          constraints: false,
          foreignKey: remoteModel.rawAttributes[this.key].fieldName,
          targetKey: remoteModel.rawAttributes[this.key].fieldName
        })
        remoteModel.belongsTo(localModel, {
          as: this.localKey,
          constraints: false,
          foreignKey: remoteModel.rawAttributes[this.key].fieldName,
          sourceKey: remoteModel.rawAttributes[this.key].fieldName
        })

        reopenType(this.localModelName, {
          [this.remoteKey]: {
            type: remoteModel.name,
            plural: true,
            resolve: (obj)=>{
              return remoteModel.findAll({where: {
                [remoteModel.rawAttributes[this.key].fieldName]: obj.id
              }})
            }
          }
        })

        reopenType(this.remoteModelName, {
          [lowercaseFirst(this.localModelName)]: {
            type: this.localModelName,
            plural: false,
            resolve: (obj)=>{
              return localModel.find({
                where: {
                  id: obj[remoteModel.rawAttributes[this.key].fieldName]
                }
              })
            }
          }
        })
      },
      toOne: () => {
        localModel.hasOne(remoteModel, {
          as: this.remoteKey,
          constraints: false,
          foreignKey: remoteModel.rawAttributes[this.key].fieldName,
          targetKey: remoteModel.rawAttributes[this.key].fieldName
        })
        remoteModel.belongsTo(localModel, {
          as: this.localKey,
          constraints: false,
          foreignKey: remoteModel.rawAttributes[this.key].fieldName,
          sourceKey: remoteModel.rawAttributes[this.key].fieldName
        })

        reopenType(this.localModelName, {
          [this.remoteKey]: {
            type: remoteModel.name,
            plural: false,
            resolve: (obj) => {
              return remoteModel.find({
                where: {
                  [remoteModel.rawAttributes[this.key].fieldName]: obj.id
                }
              })
            }
          }
        })

        reopenType(this.remoteModelName, {
          [lowercaseFirst(this.localModelName)]: {
            type: this.localModelName,
            plural: false,
            resolve: (obj) => {
              return localModel.find({
                where: {
                  id: obj[remoteModel.rawAttributes[this.key].fieldName]
                }
              })
            }
          }
        })
      }
    }[this.type]()
  }
}

module.exports = defineEdge
