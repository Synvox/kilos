const graphql = require('graphql')
const Kind = require('graphql/language')

const types = {}
const compiledTypes = {}

function createType(name, tableName, attrs, model) {
  types[name] = {
    name,
    tableName,
    model,
    attrs: {}
  }

  reopenType(name, attrs)
}

function reopenType(name, attrs) {
  Object.assign(types[name].attrs, attrs)
}

function compile() {
  Object.keys(types).forEach(key => compiledTypes[key] = compileType(types[key]))

  const queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: () => {
      const config = Object.keys(types)
        .map(key => ({ key, item: types[key] }))
        .map(({ key, item }) => {
          return {
            key: item.tableName,
            item: {
              type: new graphql.GraphQLList(compiledTypes[key]),
              resolve: () => {
                return types[key].model.findAll()
              }
            }
          }
        })
        .reduce((obj, { key, item }) => Object.assign(obj, { [key]: item }), {})
      return config
    }
  })

  return new graphql.GraphQLSchema({
    query: queryType
  })
}

function compileType({ name, tableName, model, attrs }) {
  const Type = new graphql.GraphQLObjectType({
    name: name,
    fields: () => {
      return Object.keys(attrs)
        .map(key => ({ key, item: attrs[key] }))
        .filter(({item})=>!item.private)
        .map(({key, item}) => ({ key, item: compileAttr(key, item) }))
        .reduce((obj, { key, item }) => Object.assign(obj, { [key]: item }), {})
    }
  })
  return Type
}

function parseLiteral(ast) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value)
    case Kind.OBJECT: {
      const value = Object.create(null)

      ast.fields.forEach((field) => {
        value[field.name.value] = parseLiteral(field.value)
      })

      return value
    }
    case Kind.LIST:
      return ast.values.map(parseLiteral)
    default:
      return null
  }
}

const jsonType = new graphql.GraphQLScalarType({
  name: 'JSON',
  description:
    'The `JSON` scalar type represents JSON values as specified by ' +
    '[ECMA-404](http://www.ecma-international.org/' +
    'publications/files/ECMA-ST/ECMA-404.pdf).',
  serialize: x => x,
  parseValue: x => x,
  parseLiteral,
});

const typemap = {
  'string': graphql.GraphQLString,
  'id': graphql.GraphQLString,
  'int': graphql.GraphQLInt,
  'float': graphql.GraphQLFloat,
  'long': graphql.GraphQLInt,
  'double': graphql.GraphQLFloat,
  'bool': graphql.GraphQLBoolean,
  'object': jsonType,
  'timestamp': graphql.GraphQLString,
  'date': graphql.GraphQLString
}

function compileAttr(name, def) {
  if (typeof def === 'string') return compileAttr(name, { type: def })
  const type = def.type
  const base = { resolve: def.resolve || (o => o[name]) }

  if (typemap[type]) return { ...base, type: typemap[type] }
  const modelType = def.type
  const exists = !!types[modelType]

  if (!exists) throw new Error(`Type ${modelType} does not exist.`)

  return {
    ...base,
    type: def.plural ? new graphql.GraphQLList(compiledTypes[modelType]) : compiledTypes[modelType]
  }
}

module.exports = { createType, reopenType, compile }

// setTimeout(()=>{
// }, 100)
