'use strict'

class GitHubIssueNotifier {
  constructor ({ octokit, repo }, log) {
    this.log = log
    this.octokit = octokit
    this.repo = repo
  }

  async notify (ngrokUrl) {
    const { repo } = this
    this.log.info({ repo }, 'creating issue')
    this.issue = (await this.octokit.issues.create({
      ...repo,
      title: 'Provide OTP for release', // TODO(mmarchini): show version number
      body: ngrokUrl // TODO(mmarchini): add more info to the issue
      // TODO(mmarchini): Mention team
      // TODO(mmarchini): Update issue if exists (in case of rerun)
    })).data
    this.log.info('issue created')
  }

  async end () {
    const { repo } = this
    const issue = this.issue.number
    this.log.info({ repo, issue }, 'closing issue')
    this.issue = await this.octokit.issues.update({
      ...repo, issue_number: issue, state: 'closed'
    })
    this.log.info('issue closed')
  }
}

module.exports = { GitHubIssueNotifier }
