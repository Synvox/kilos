const transformKeys = require('transformkeys')
const { tableize, underscore, camelize } = require('inflection')
const keyCast = require('./key-cast')

const create = ({self, tableName, keys})=>({db, sequence})=>async (values)=>{
  const casedValues = transformKeys(self.parse(values), 'snake')
  casedValues['sequence_id'] = sequence.id
  return self.parse((await db(tableName).insert(casedValues).returning('*'))[0])
}

const get = ({tableName, keys})=>({db, sequence})=>async (id)=>{
  return self.parse(await db(tableName).where({id}).first())
}

const update = ({tableName, keys})=>({db, sequence})=>()=>{
  
}

const destroy = ({tableName, keys})=>({db, sequence})=>()=>{

}

const base = (self)=>{
  const obj = {}
  return obj
}

const parse = ({keys, self})=>(values)=>{
  if (Array.isArray(values)) return values.map(self.parse)
  values = transformKeys(values)

  return Object.keys(keys).reduce((obj, key) => Object.assign(obj, {
    [key]: values[key] != null ? keyCast(keys[key])(values[key]) : values[key]
  }), {...base(self)})
}

module.exports = ({
  name,
  tableName,
  private,
  keys
})=>{
  const self = {}
  Object.assign(self, {
    parse: parse({ self, keys }),
    create: create({ self, tableName, keys }),
    get: get({ self, tableName, keys }),
    update: update({ self, tableName, keys }),
    destroy: destroy({ self, tableName, keys })
  })
  return self
}
