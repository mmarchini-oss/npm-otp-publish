'use strict'

class GitHubIssueNotifier {
  constructor ({ octokit, repo, version, githubIssue }, log) {
    log.info({ repo }, 'creating GitHub issue notifier')
    this.log = log
    this.octokit = octokit
    this.repo = repo
    this.version = version
    this.githubIssue = githubIssue
  }

  getTitle () {
    const { version } = this
    return `Release v${version.name} waiting for OTP to publish to npm`
  }

  getBody (ngrokUrl) {
    const { version } = this
    const { actor } = this.githubIssue
    const v = version.url ? `[v${version.name}](${version.url})` : `v${version.name}`
    return `Please [provide an One-Time Password](${ngrokUrl}) to continue the release for ${v}.

${actor ? `**Requested by**: @${actor}` : ''}
**OTP URL**: ${ngrokUrl}`
  }

  getAssignees () {
    const { actor, releaseTeam } = this.githubIssue
    let assignees = []
    if (actor) {
      assignees = assignees.concat([actor])
    }
    if (releaseTeam) {
      assignees = assignees.concat([releaseTeam])
    }
    return assignees
  }

  async notify (ngrokUrl) {
    const { repo } = this
    const body = this.getBody(ngrokUrl)
    const title = this.getTitle()
    this.log.info({ repo, title, body }, 'creating issue')
    this.issue = (await this.octokit.issues.create({
      ...repo,
      title,
      body
    })).data
    // TODO(mmarchini): Update issue if exists (in case of rerun)
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
