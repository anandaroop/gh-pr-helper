let state = 'expanded'

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === 'clicked_browser_action') {
    if (state == 'expanded') {
      // collapse file details
      document
        .querySelectorAll('.js-details-container:not(.open) .js-details-target')
        .forEach(el => el.click())

      // hide file notes
      document
        .querySelectorAll('.show-inline-notes .js-toggle-file-notes')
        .forEach(el => el.click())

      state = 'collapsed'
    } else {
      // expand file details
      document
        .querySelectorAll('.js-details-container.open .js-details-target')
        .forEach(el => el.click())

      // show file notes
      document
        .querySelectorAll('.has-inline-notes .js-toggle-file-notes')
        .forEach(el => el.click())

      state = 'expanded'
    }
    console.log(state)
  }
})

const defaultStyle =
  'display: inline-block; height: 1em; width: 1em; margin: 0 0.25em 0.25em 0; background: #eee'

const highlightStyle = defaultStyle.replace('#eee', '#6E1FFF')

const fetchCommits = () => {
  const parts = window.location.pathname.split('/')
  const [_, repoOwner, repoName, _pull, pullNumber] = parts

  // const query = `{ user(login: "anandaroop") { name } }`

  const query = `{
    repository(owner: "${repoOwner}", name: "${repoName}"){
      pullRequest(number: ${pullNumber}) {
        url
        commits(first: 100) {
          edges {
            node {
              commit {
                oid
                abbreviatedOid
                messageHeadline
                url
              }
            }
          }
        }
      }
    }
  }`

  const payload = JSON.stringify({ query })

  const url = 'https://api.github.com/graphql'

  const headers = {
    Authorization: 'bearer REPLACE_WITH_TOKEN_FROM_GITHUB'
  }

  const options = {
    headers,
    method: 'POST',
    'Content-Type': 'application/json',
    Accept: 'application/json',
    body: payload
  }

  return fetch(url, options).then(response => response.json())
}

const redraw = () => {
  $('#partial-discussion-header').append(
    '<div id="collapse-root" style="margin: 1em 0"></div>'
  )
  let style, url
  commits.forEach((commit, i) => {
    url = `${pullUrl}/commits/${commit.oid}`
    style = window.location.pathname.match(commit.oid)
      ? highlightStyle
      : defaultStyle
    $('#collapse-root').append(
      `<a style="${style}" title="${commit.abbreviatedOid} — ${
        commit.messageHeadline
      }" href="${url}"> </a>`
    )
  })
}

let commits, pullUrl

const fetchCommitsAndDraw = () => {
  fetchCommits().then(json => {
    pullUrl = json.data.repository.pullRequest.url
    commits = json.data.repository.pullRequest.commits.edges.map(
      e => e.node.commit
    )
    redraw()
  })
}

$(window).on('load', () => {
  fetchCommitsAndDraw()
})

$(document).on('pjax:success', () => {
  redraw()
})
