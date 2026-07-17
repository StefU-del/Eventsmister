const apiUrl = 'http://127.0.0.1:8000'

const currentUser = {
  id: 1,
  username: 'cypress_user',
  email: 'cypress@example.com',
  date_of_birth: '1995-06-12',
  interests: ['music'],
  profile_photo_url: null,
  created_at: '2030-01-01T10:00:00Z',
}

const eventOwner = {
  id: 7,
  username: 'london_host',
  interests: ['music'],
  profile_photo_url: null,
  created_at: '2030-01-01T10:00:00Z',
}

const posts = [
  {
    id: 11,
    owner_id: eventOwner.id,
    owner: eventOwner,
    title: 'Spring Jazz Courtyard',
    description: 'Live music in a leafy courtyard with local performers.',
    category: 'Music',
    location: 'Camden',
    image_url: null,
    hashtags: ['jazz', 'live-music'],
    event_date: '2030-05-20T18:30:00Z',
    created_at: '2030-04-01T10:00:00Z',
    like_count: 2,
    comment_count: 1,
  },
  {
    id: 12,
    owner_id: eventOwner.id,
    owner: eventOwner,
    title: 'Riverside Pottery Workshop',
    description: '<script>window.compromised = true</script> Shape clay beside the river.',
    category: 'Arts',
    location: 'Richmond',
    image_url: null,
    hashtags: ['pottery', 'workshop'],
    event_date: '2030-05-22T12:00:00Z',
    created_at: '2030-04-02T10:00:00Z',
    like_count: 0,
    comment_count: 0,
  },
]

function interceptFeed() {
  cy.intercept('GET', `${apiUrl}/posts/`, { statusCode: 200, body: posts }).as('posts')
}

function restoreSession() {
  cy.intercept('GET', `${apiUrl}/auth/me`, (request) => {
    expect(request.headers.authorization).to.equal('Bearer cypress-token')
    request.reply({ statusCode: 200, body: currentUser })
  }).as('currentUser')
  cy.intercept('GET', `${apiUrl}/auth/me/likes`, {
    statusCode: 200,
    body: { post_ids: [11], comment_ids: [] },
  }).as('likes')
}

describe('Eventsmister UI', () => {
  it('renders, searches, and filters the event feed without executing event content', () => {
    interceptFeed()
    cy.visit('/')
    cy.wait('@posts')

    cy.findByRole('heading', { name: 'Upcoming in London' }).should('be.visible')
    cy.findByRole('heading', { name: 'Spring Jazz Courtyard' }).should('be.visible')
    cy.findByRole('heading', { name: 'Riverside Pottery Workshop' }).should('be.visible')
    cy.window().its('compromised').should('be.undefined')

    cy.findByRole('searchbox', { name: 'Search events' }).type('pottery')
    cy.findByRole('heading', { name: 'Spring Jazz Courtyard' }).should('not.exist')
    cy.findByRole('heading', { name: 'Riverside Pottery Workshop' }).should('be.visible')

    cy.findByRole('searchbox', { name: 'Search events' }).clear()
    cy.findByRole('button', { name: 'Music' }).click()
    cy.findByRole('heading', { name: 'Spring Jazz Courtyard' }).should('be.visible')
    cy.findByRole('heading', { name: 'Riverside Pottery Workshop' }).should('not.exist')
  })

  it('follows hashtag links and displays the matching feed', () => {
    interceptFeed()
    cy.visit('/')
    cy.wait('@posts')

    cy.findByRole('link', { name: '#jazz' }).click()
    cy.location('search').should('equal', '?tag=jazz')
    cy.findByRole('heading', { name: '#jazz' }).should('be.visible')
    cy.findByRole('heading', { name: 'Spring Jazz Courtyard' }).should('be.visible')
    cy.findByRole('heading', { name: 'Riverside Pottery Workshop' }).should('not.exist')
  })

  it('restores an authenticated session and shows hearted events', () => {
    restoreSession()
    cy.intercept('GET', `${apiUrl}/auth/me/liked-posts`, {
      statusCode: 200,
      body: [posts[0]],
    }).as('heartedPosts')

    cy.visit('/hearted', {
      onBeforeLoad(window) {
        window.localStorage.setItem('eventsmister_access_token', 'cypress-token')
      },
    })

    cy.wait(['@currentUser', '@likes', '@heartedPosts'])
    cy.findByRole('heading', { name: 'Hearted events' }).should('be.visible')
    cy.findByRole('heading', { name: 'Spring Jazz Courtyard' }).should('be.visible')
    cy.findByRole('link', { name: 'People' }).should('be.visible')
    cy.findByRole('link', { name: 'cypress_user' }).should('be.visible')
  })

  it('redirects anonymous visitors away from protected pages', () => {
    cy.visit('/people')

    cy.location('pathname').should('equal', '/login')
    cy.findByRole('heading', { name: 'Your London plans are waiting.' }).should('be.visible')
  })

  it('shows API authentication errors in the login form', () => {
    cy.intercept('POST', `${apiUrl}/auth/login`, {
      statusCode: 401,
      body: { detail: 'Invalid username or password' },
    }).as('login')
    cy.visit('/login')

    cy.findByLabelText('Username').type('unknown_user')
    cy.findByLabelText('Password').type('WrongPassword123!')
    cy.findByRole('button', { name: 'Log in' }).click()

    cy.wait('@login')
    cy.findByRole('alert').should('have.text', 'Invalid username or password')
    cy.location('pathname').should('equal', '/login')
  })

  it('uploads a local event photo before publishing', () => {
    restoreSession()
    const uploadedUrl = `${apiUrl}/uploads/cypress-event.jpg`
    const createdPost = {
      ...posts[0],
      id: 30,
      owner_id: currentUser.id,
      owner: currentUser,
      title: 'Uploaded photo event',
      image_url: uploadedUrl,
      like_count: 0,
      comment_count: 0,
    }
    cy.intercept('POST', `${apiUrl}/uploads/images`, {
      statusCode: 200,
      body: { url: uploadedUrl },
    }).as('uploadImage')
    cy.intercept('POST', `${apiUrl}/posts/`, (request) => {
      request.reply({ statusCode: 200, body: { ...createdPost, ...request.body } })
    }).as('createPost')
    cy.intercept('GET', `${apiUrl}/posts/30`, { statusCode: 200, body: createdPost })
    cy.intercept('GET', `${apiUrl}/posts/30/comments`, { statusCode: 200, body: [] })

    cy.visit('/events/new', {
      onBeforeLoad(window) {
        window.localStorage.setItem('eventsmister_access_token', 'cypress-token')
      },
    })
    cy.wait(['@currentUser', '@likes'])
    cy.findByLabelText('Event title').type('Uploaded photo event')
    cy.findByLabelText('Description').type('An event created with a photo from this computer.')
    cy.findByLabelText('London location').type('Hackney')
    cy.findByLabelText('Event photo').selectFile(
      'src/assets/spring-jazz-courtyard.jpg',
      { force: true },
    )
    cy.wait('@uploadImage')
    cy.findByAltText('Event photo preview').should('exist')
    cy.findByRole('button', { name: 'Publish event' }).click()

    cy.wait('@createPost').its('request.body.image_url').should('equal', uploadedUrl)
    cy.location('pathname').should('equal', '/events/30')
  })

  it('searches wider London through the authenticated backend', () => {
    restoreSession()
    interceptFeed()
    cy.intercept('GET', `${apiUrl}/discover/external?query=jazz`, (request) => {
      expect(request.headers.authorization).to.equal('Bearer cypress-token')
      request.reply({
        statusCode: 200,
        body: {
          events: [
            {
              external_id: 'ticketmaster-91',
              source: 'ticketmaster',
              source_name: 'Ticketmaster',
              source_url: 'https://ticketmaster.example/events/91',
              source_logo_url: null,
              title: 'London jazz weekender',
              description: 'A full weekend of live jazz performances.',
              category: 'Music',
              location: 'South Bank, London',
              image_url: 'https://images.example/jazz-weekender.jpg',
              event_date: '2030-06-01T19:30:00Z',
            },
          ],
          providers: [
            {
              source: 'ticketmaster',
              source_name: 'Ticketmaster',
              enabled: true,
              returned: 1,
              error: null,
            },
          ],
          terms: ['jazz', 'music'],
          search_suggestions_html: null,
        },
      })
    }).as('externalEvents')

    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.setItem('eventsmister_access_token', 'cypress-token')
      },
    })
    cy.wait(['@currentUser', '@likes', '@posts'])
    cy.findByRole('searchbox', { name: 'Search events' }).type('jazz')
    cy.findByRole('button', { name: 'Search wider' }).click()

    cy.wait('@externalEvents')
    cy.findByRole('heading', { name: 'Events from around the web' }).should('be.visible')
    cy.findByRole('heading', { name: 'London jazz weekender' }).should('be.visible')
    cy.findByRole('link', { name: 'View on Ticketmaster' })
      .should('have.attr', 'href', 'https://ticketmaster.example/events/91')
      .and('have.attr', 'target', '_blank')
  })
})
