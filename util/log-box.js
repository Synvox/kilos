const chalk = require('chalk')

const logBox = ({ header, body, color = 'yellow' }) => {
  const prefix = '│ '
  const inners = prefix + body
    .split('\n')
    .map(x => {
      if (x.length > process.stdout.columns - 5) {
        return [x.substring(0, x.lastIndexOf(' ')), ' ' + x.substring(x.lastIndexOf(' '))]
      }
      return [x]
    })
    .reduce((arr, item) => arr.concat(...item), [])
    .map(str => `${str}${' '.repeat(Math.max(0, process.stdout.columns - str.length - 3))}│`)
    .join(`\n${prefix}`)

  return chalk[color]('┌─' + '─'.repeat(Math.max(0, header.length + 1)) + '┐')
    + '\n' + chalk[color](`│ ${header} │`)
    + '\n' + chalk[color]('├─' + '─'.repeat(Math.max(0, header.length + 1)) + '┴' + '─'.repeat(Math.max(0, process.stdout.columns - header.length - 5)) + '┐')
    + '\n' + chalk[color](inners)
    + '\n' + chalk[color]('└' + '─'.repeat(Math.max(0, process.stdout.columns - 2)) + '┘\n')
}

module.exports = logBox
