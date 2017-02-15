'use strict'

// Native
const path = require('path')
const spawn = require('child_process').spawn

// Packages
const parser = require('minimist')
const pkginfo = require('pkginfo')
const loudRejection = require('loud-rejection')
const camelcase = require('camelcase')
const chalk = require('chalk')

class Args {
  constructor() {
    // Will later hold registered options and commands
    this.details = {
      options: [],
      commands: []
    }

    // Configuration defaults
    this.config = {
      help: true,
      version: true,
      usageFilter: null,
      value: null,
      name: null
    }

    // Make unhandled promise rejections fail loudly instead of the default silent fail
    loudRejection()
  }

  options(list) {
    if (list.constructor !== Array) {
      throw new Error('Item passed to .options is not an array')
    }

    for (const item of list) {
      const preset = item.defaultValue || false
      const init = item.init || false

      this.option(item.name, item.description, preset, init)
    }

    return this
  }

  option(name, description, defaultValue, init) {
    let usage = []

    const assignShort = (name, options, short) => {
      if (options.find(flagName => flagName.usage[0] === short)) {
        short = name.charAt(0).toUpperCase()
      }
      return [short, name]
    }

    // If name is an array, pick the values
    // Otherwise just use the whole thing
    switch (name.constructor) {
      case String:
        usage = assignShort(name, this.details.options, name.charAt(0))
        break
      case Array:
        usage = usage.concat(name)
        break
      default:
        throw new Error('Invalid name for option')
    }

    // Throw error if short option is too long
    if (usage.length > 0 && usage[0].length > 1) {
      throw new Error('Short version of option is longer than 1 char')
    }

    const optionDetails = {
      defaultValue,
      usage,
      description
    }

    let defaultIsWrong

    switch (defaultValue) {
      case false:
        defaultIsWrong = true
        break
      case null:
        defaultIsWrong = true
        break
      case undefined:
        defaultIsWrong = true
        break
      default:
        defaultIsWrong = false
    }

    // Set initializer depending on type of default value
    if (!defaultIsWrong) {
      const initFunction = typeof init === 'function'
      optionDetails.init = initFunction ? init : this.handleType(defaultValue)[1]
    }

    // Register option to global scope
    this.details.options.push(optionDetails)

    // Allow chaining of .option()
    return this
  }

  command(usage, description, init, aliases) {
    if (Array.isArray(init)) {
      aliases = init
      init = undefined
    }
    if (aliases && Array.isArray(aliases)) {
      usage = [].concat([usage], aliases)
    }

    // Register command to global scope
    this.details.commands.push({
      usage,
      description,
      init: typeof init === 'function' ? init : false
    })

    // Allow chaining of .command()
    return this
  }

  handleType(value) {
    let type = value

    if (typeof value !== 'function') {
      type = value.constructor
    }

    // Depending on the type of the default value,
    // select a default initializer function
    switch (type) {
      case String:
        return ['[value]']
      case Array:
        return ['<list>']
      case Number:
      case parseInt:
        return ['<n>', parseInt]
      default:
        return ['']
    }
  }

  readOption(option) {
    let value = false
    const contents = {}

    // If option has been used, get its value
    for (const name of option.usage) {
      const fromArgs = this.raw[name]
      if (typeof fromArgs !== 'undefined') {
        value = fromArgs
      }
    }

    // Process the option's value
    for (let name of option.usage) {
      let propVal = value

      if (typeof option.defaultValue !== 'undefined' && typeof propVal !== typeof option.defaultValue) {
        propVal = option.defaultValue
      }

      let condition = true

      if (option.init) {
        // Only use the toString initializer if value is a number
        if (option.init === toString) {
          condition = propVal.constructor === Number
        }

        if (condition) {
          // Pass it through the initializer
          propVal = option.init(propVal)
        }
      }

      // Camelcase option name (skip short flag)
      if (name.length > 1) {
        name = camelcase(name)
      }

      // Add option to list
      contents[name] = propVal
    }

    return contents
  }

  getOptions() {
    const options = {}
    const args = {}

    // Copy over the arguments
    Object.assign(args, this.raw)
    delete args._

    // Set option defaults
    for (const option of this.details.options) {
      if (typeof option.defaultValue === 'undefined') {
        continue
      }

      Object.assign(options, this.readOption(option))
    }

    // Override defaults if used in command line
    for (const option in args) {
      if (!{}.hasOwnProperty.call(args, option)) {
        continue
      }

      const related = this.isDefined(option, 'options')

      if (related) {
        const details = this.readOption(related)
        Object.assign(options, details)
      }
    }

    return options
  }

  generateDetails(kind) {
    // Get all properties of kind from global scope
    const items = this.details[kind]
    const parts = []
    const isCmd = kind === 'commands'

    // Sort items alphabetically
    items.sort((a, b) => {
      const first = isCmd ? a.usage : a.usage[1]
      const second = isCmd ? b.usage : b.usage[1]

      switch (true) {
        case (first < second): return -1
        case (first > second): return 1
        default: return 0
      }
    })

    for (const item in items) {
      if (!{}.hasOwnProperty.call(items, item)) {
        continue
      }

      let usage = items[item].usage
      let initial = items[item].defaultValue

      // If usage is an array, show its contents
      if (usage.constructor === Array) {
        if (isCmd) {
          usage = usage.join(', ')
        } else {
          const isVersion = usage.indexOf('v')
          usage = `-${usage[0]}, --${usage[1]}`

          if (!initial) {
            initial = items[item].init
          }

          usage += (initial && isVersion === -1) ? ' ' + this.handleType(initial)[0] : ''
        }
      }

      // Overwrite usage with readable syntax
      items[item].usage = usage
    }

    // Find length of longest option or command
    // Before doing that, make a copy of the original array
    const longest = items.slice().sort((a, b) => {
      return b.usage.length - a.usage.length
    })[0].usage.length

    for (const item of items) {
      let usage = item.usage
      let description = item.description
      const defaultValue = item.defaultValue
      const difference = longest - usage.length

      // Compensate the difference to longest property with spaces
      usage += ' '.repeat(difference)

      // Add some space around it as well
      if (typeof defaultValue !== 'undefined') {
        if (typeof defaultValue === 'boolean') {
          description += ` (${defaultValue ? 'enabled' : 'disabled'} by default)`
        } else {
          description += ` (defaults to ${JSON.stringify(defaultValue)})`
        }
      }
      parts.push('  ' + chalk.yellow(usage) + '  ' + chalk.dim(description))
    }

    return parts
  }

  runCommand(details, options) {
    // If help is disabled, remove initializer
    if (details.usage === 'help' && !this.config.help) {
      details.init = false
    }

    // If command has initializer, call it
    if (details.init) {
      const sub = [].concat(this.sub)
      sub.shift()

      return details.init.bind(this)(details.usage, sub, options)
    }

    // Generate full name of binary
    const full = this.binary + '-' + (Array.isArray(details.usage) ? details.usage[0] : details.usage)

    const args = process.argv
    let i = 0

    while (i < 3) {
      args.shift()
      i++
    }

    // Run binary of sub command
    this.child = spawn(full, args, {
      stdio: 'inherit'
    })

    // Throw an error if something fails within that binary
    this.child.on('error', err => {
      throw err
    })

    this.child.on('exit', (code, signal) => {
      process.on('exit', () => {
        this.child = null
        if (signal) {
          process.kill(process.pid, signal)
        } else {
          process.exit(code)
        }
      })
    })

    // proxy SIGINT to child process
    process.on('SIGINT', () => {
      if (this.child) {
        this.child.kill('SIGINT')
        this.child.kill('SIGTERM') // if that didn't work, we're probably in an infinite loop, so make it die
      }
    })
  }

  checkVersion() {
    const parent = module.parent

    // Load parent module
    pkginfo(parent)

    // And get its version propery
    const version = parent.exports.version

    if (version) {
      // If it exists, register it as a default option
      this.option('version', 'Output the version number')

      // And immediately output it if used in command line
      if (this.raw.v || this.raw.version) {
        console.log(version)
        process.exit()
      }
    }
  }

  isDefined(name, list) {
    // Get all items of kind
    const children = this.details[list]

    // Check if a child matches the requested name
    for (const child of children) {
      const usage = child.usage
      const type = usage.constructor

      if (type === Array && usage.indexOf(name) > -1) {
        return child
      }

      if (type === String && usage === name) {
        return child
      }
    }

    // If nothing matches, item is not defined
    return false
  }

  parse(argv, options) {
    // Override default option values
    Object.assign(this.config, options)

    if (this.config.help) {
      // Register default options and commands
      this.option('help', 'Output usage information')
      this.command('help', 'Display help', this.showHelp)
    }

    // Parse arguments using minimist
    this.raw = parser(argv.slice(1), this.config.minimist)
    this.binary = path.basename(this.raw._[0])

    // If default version is allowed, check for it
    if (this.config.version) {
      this.checkVersion()
    }

    const subCommand = this.raw._[1]
    const helpTriggered = this.raw.h || this.raw.help

    const args = {}
    const defined = this.isDefined(subCommand, 'commands')
    const optionList = this.getOptions()

    Object.assign(args, this.raw)
    args._.shift()

    // Export sub arguments of command
    this.sub = args._

    // If sub command is defined, run it
    if (defined) {
      this.runCommand(defined, optionList)
      return {}
    }

    // Show usage information if "help" or "h" option was used
    // And respect the option related to it
    if (this.config.help && helpTriggered) {
      this.showHelp()
    }

    // Hand back list of options
    return optionList
  }

  showHelp() {
    const name = this.config.name || this.binary.replace('-', ' ')
    const firstBig = word => word.charAt(0).toUpperCase() + word.substr(1)

    const parts = []

    const groups = {
      commands: true,
      options: true
    }

    for (const group in groups) {
      if (this.details[group].length > 0) {
        continue
      }

      groups[group] = false
    }

    const optionHandle = groups.options ? ' [options]' : ''
    const cmdHandle = groups.commands ? ' [command]' : ''
    const value = typeof this.config.value === 'string' ? ' ' + this.config.value : ''

    parts.push([
      '',
      'Usage: ' + chalk.yellow(name) + chalk.dim(optionHandle + cmdHandle + value),
      ''
    ])

    for (const group in groups) {
      if (!groups[group]) {
        continue
      }

      parts.push([
        '',
        firstBig(group) + ':',
        '',
        ''
      ])

      parts.push(this.generateDetails(group))
      parts.push(['', ''])
    }

    let output = ''

    // And finally, merge and output them
    for (const part of parts) {
      output += part.join('\n  ')
    }

    if (!groups.commands && !groups.options) {
      output = 'No sub commands or options available'
    }

    const usageFilter = this.config.usageFilter

    // If filter is available, pass usage information through
    if (typeof usageFilter === 'function') {
      output = usageFilter(output) || output
    }

    console.log(output)
    process.exit()
  }
}

module.exports = exports.default = new Args()
