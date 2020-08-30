'use strict'

const { ConsoleNotifier } = require('./notifiers/console')
const { GitHubIssueNotifier } = require('./notifiers/github-issue')

class Notifier {
  constructor (config, log) {
    this.log = log
    this.config = config
    this.notifier = Notifier.getNotifier(this.config.notifier, log)
  }

  static getNotifier (notifier, log) {
    switch (notifier) {
      case 'console':
        return new ConsoleNotifier(log)
      case 'github-issue':
        return new GitHubIssueNotifier(log)
      default:
        throw new Error(`Invalid Notifier: ${notifier}`)
    }
  }

  notify (ngrokUrl) {
    return this.notifier.notify(ngrokUrl)
  }

  async end () {
    return this.notifier.end()
  }
}

module.exports = { Notifier }
