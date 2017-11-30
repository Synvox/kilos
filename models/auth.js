const jsonwebtoken = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const models = require('./')

const verify = jwt => new Promise((resolve, reject) => {
  jsonwebtoken.verify(jwt, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return reject(err)
    resolve(decoded)
  })
})

const sign = obj => new Promise((resolve, reject) => {
  jsonwebtoken.sign(obj, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return reject(err)
    resolve(decoded)
  })
})

async function getUser({ req }) {
  const { User } = models
  let token = req.headers['authorization'] || req.cookies['authorization']

  if (!token)
    return null
  
  try {
    if (token.startsWith('Bearer'))
      token = token.substring('Bearer '.length)
    const decoded = await verify(token)
    const user = await User.find({ where: { id: decoded.id } })
    return user ? user : null
  } catch(e) {
    return null
  }
}

async function getJWT({ username, password }) {
  const { User } = models
  const user = await User.find({ where: { username } })
  if (!user) return null

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  const payload = { id: user.id }
  const jwt = await sign(payload)

  return jwt
}

module.exports = { getUser, getJWT }
