'use strict'

const { octokit } = require('../octokit')
const { githubContext } = require('../config')

class GitHubIssueNotifier {
  constructor (log) {
    this.log = log
  }

  async notify (ngrokUrl) {
    const { repo } = githubContext
    this.log.info({ repo }, 'creating issue')
    this.issue = (await octokit.issues.create({
      ...repo,
      title: 'Provide OTP for release', // TODO(mmarchini): show version number
      body: ngrokUrl // TODO(mmarchini): add more info to the issue
      // TODO(mmarchini): Mention team
      // TODO(mmarchini): Update issue if exists (in case of rerun)
    })).data
    this.log.info('issue created')
  }

  async end () {
    const { repo } = githubContext
    const issue = this.issue.number
    this.log.info({ repo, issue }, 'closing issue')
    this.issue = await octokit.issues.update({
      ...repo, issue_number: issue, state: 'closed'
    })
    this.log('issue closed')
  }
}

module.exports = { GitHubIssueNotifier }
