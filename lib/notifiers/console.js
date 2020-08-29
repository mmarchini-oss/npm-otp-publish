'use strict'

class ConsoleNotifier {
  constructor (log) {
    this.log = log
  }

  notify (ngrokUrl) {
    this.log.info({ ngrokUrl }, 'notifying')
  }

  async end () {
    this.log.info('ending notifier')
  }
}

module.exports = { ConsoleNotifier }
