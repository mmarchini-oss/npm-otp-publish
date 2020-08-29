'use strict'

const { NOTIFIER } = require('./config')

const { ConsoleNotifier } = require('./notifiers/console')
const { GitHubIssueNotifier } = require('./notifiers/github-issue')

class Notifier {
  constructor (log) {
    this.log = log
    this.notifier = Notifier.getNotifier(NOTIFIER, log)
  }

  static getNotifier (notifier, log) {
    switch (notifier) {
      case 'console':
        return new ConsoleNotifier(log)
      case 'github-issue':
        return new GitHubIssueNotifier(log)
      default:
        throw new Error(`Invalid Notifier: ${NOTIFIER}`)
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
