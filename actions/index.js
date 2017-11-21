const actions = {}
module.exports = {action, dispatch, actions}

function action(name, schema, fn){
  actions[name] = {schema, fn}
}

async function dispatch(type, cxt) {
  if (!actions[type]) throw new Error(`Action ${type} is not defined`)
  let result = null

  const modifiedCxt = Object.assign({}, cxt, Object.keys(cxt.models).reduce((obj, key)=>Object.assign(obj, {
    [key]: Object.keys(cxt.models[key].model).reduce((obj, fnName)=>Object.assign(obj, {
      [fnName]: cxt.models[key].model[fnName](cxt)
    }), {})
  }), {}))

  console.log(modifiedCxt)

  try {
    result = await actions[type].fn(modifiedCxt)
  } catch(e) {
    result = {
      error: e.message
    }
  }
  
  return result
}
