// Packages
const ora = require('ora')
const {red} = require('chalk')

exports.create = message => {
  if (global.spinner) {
    global.spinner.succeed()
  }

  global.spinner = ora(message).start()
}

exports.fail = message => {
  if (global.spinner) {
    global.spinner.fail()
    console.log('')
  }

  console.error(`${red('Error!')} ${message}`)
  process.exit(1)
}
