'use strict'

const { ConsoleNotifier } = require('./notifiers/console')
const { GitHubIssueNotifier } = require('./notifiers/github-issue')

class Notifier {
  constructor (config, log) {
    this.log = log
    this.config = config
    log.info({ config }, 'creating notifier')
    this.notifier = new (Notifier.getNotifier(this.config.notifier))(config, log)
  }

  static getNotifier (notifier) {
    switch (notifier) {
      case 'console':
        return ConsoleNotifier
      case 'github-issue':
        return GitHubIssueNotifier
      default:
        throw new Error(`Invalid Notifier: ${notifier}`)
    }
  }

  async notify (ngrokUrl) {
    return this.notifier.notify(ngrokUrl)
  }

  async end () {
    return this.notifier.end()
  }
}

module.exports = { Notifier }
