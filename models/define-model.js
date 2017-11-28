const cache = require('./cache')
const { Sequelize, sequelize } = require('./sequelize')
const defineEdge = require('../edges/define-edge')
const {ID} = require('./id')

function defineModel(name) {
  return new ModelBuilder(name)
}

class ModelBuilder {
  constructor(name='') {
    this.name = name
    this.strict = false
  }
  tableName(tableName) {
    this.tableName = tableName
    return this
  }
  attrs(attrs, strict=false) {
    this.attrs = getDef(attrs, strict)
    this.strict = strict
    return this
  }
  build() {
    const model = sequelize.define(this.name, this.attrs, { tableName: this.tableName })

    if (!this.strict) {
      setImmediate(()=>{
        defineEdge('ScopeSequence', 'sequence')
          .toMany(this.name, this.tableName)
          .usingKey('sequenceId')
          .build()
      })
    }

    cache.set(this.name, model)
    return model
  }
}

const typemap = {
  'string': Sequelize['STRING'],
  'id': ID,
  'int': Sequelize['INTEGER'],
  'float': Sequelize['FLOAT'],
  'long': Sequelize['BIGINT'],
  'double': Sequelize['DOUBLE'],
  'bool': Sequelize['BOOLEAN'],
  'object': Sequelize['JSON'],
  'timestamp': Sequelize['DATE'],
  'date': Sequelize['DATEONLY']
}

const toSnake = key => key
  .replace(/(\b|^|[a-z])([A-Z])/g, '$1 $2')
  .replace(/ +/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/ /g,'_')

function getDef(props, strict) {
  const obj = {
    ...Object.keys(props)
      .map(key => ({ key, item: props[key] }))
      .map(({ key, item }) => ({
        key,
        item: typeof item !== 'object' ? { type: item } : item
      }))
      .map(({ key, item }) => ({
        key, item: {
          ...item,
          field: toSnake(key),
          type: typemap[item.type]
        }
      }))
      .reduce((obj, { key, item }) => Object.assign(obj, { [key]: item }), {})
  }

  if (!strict) {
    Object.assign(obj, {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      sequenceId: {
        field: 'sequence_id',
        type: Sequelize.BIGINT
      }
    })
  }

  return obj
}

require('./built-in')(defineModel)
require('../edges/built-in')(defineEdge)

module.exports = defineModel
