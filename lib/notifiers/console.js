'use strict'

class ConsoleNotifier {
  constructor (_, log) {
    this.log = log
  }

  async notify (ngrokUrl) {
    this.log.info({ ngrokUrl }, 'notifying')
  }

  async end () {
    this.log.info('ending notifier')
  }
}

module.exports = { ConsoleNotifier }
