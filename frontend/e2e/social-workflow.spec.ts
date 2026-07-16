import { expect, test, type Page } from '@playwright/test'

async function register(page: Page, username: string) {
  await page.goto('/register')
  await page.getByLabel(/^Username/).fill(username)
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel(/^Password/).fill('Password123!')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('link', { name: 'Create event' })).toBeVisible()
}

test('two users can complete the event social workflow', async ({ browser, page }) => {
  const uniqueId = Date.now().toString().slice(-7)
  const hostUsername = `host_${uniqueId}`
  const guestUsername = `guest_${uniqueId}`
  const uploadFile = 'src/assets/spring-jazz-courtyard.jpg'

  await register(page, hostUsername)
  await page.getByRole('link', { name: hostUsername }).click()
  await page.getByRole('button', { name: 'Edit profile' }).click()
  await page.getByLabel(/Date of birth/).fill('1994-03-12')
  await page.getByLabel(/Interests/).fill('community, live music, community')
  const profileUploadResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/uploads/images') && response.request().method() === 'POST',
  )
  await page.getByLabel('Profile photo').setInputFiles(uploadFile)
  expect((await profileUploadResponse).status()).toBe(200)
  await expect(page.getByAltText('Profile photo preview')).toBeVisible()
  const profileResponse = page.waitForResponse(
    (response) => response.url().endsWith('/auth/me') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Save profile' }).click()
  expect((await profileResponse).status()).toBe(200)
  await expect(page.getByText('community', { exact: true })).toBeVisible()

  await page.locator('#main-navigation').getByRole('link', { name: 'Create event' }).click()
  await page.getByLabel('Event title').fill('A real browser test event')
  await page
    .getByLabel('Description')
    .fill('An event created through the complete browser and FastAPI workflow.')
  await page.getByLabel('Category').selectOption('Community')
  await page.getByLabel('London location').fill('Brixton')
  const eventUploadResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/uploads/images') && response.request().method() === 'POST',
  )
  await page.getByLabel('Event photo').setInputFiles(uploadFile)
  const uploadedEventImage = await eventUploadResponse
  expect(uploadedEventImage.status()).toBe(200)
  const uploadedEventImageUrl = ((await uploadedEventImage.json()) as { url: string }).url
  await expect(page.getByAltText('Event photo preview')).toBeVisible()
  await page.getByLabel('Hashtags').fill('#community #brixton community')
  const createEventResponse = page.waitForResponse(
    (response) => response.url().endsWith('/posts/') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Publish event' }).click()
  expect((await createEventResponse).status()).toBe(200)
  await expect(page).toHaveURL(/\/events\/\d+$/)
  await expect(page.getByRole('heading', { name: 'A real browser test event' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'A real browser test event event' })).toHaveAttribute(
    'src',
    uploadedEventImageUrl,
  )
  await expect(page.getByRole('link', { name: '#community' })).toHaveAttribute(
    'href',
    '/?tag=community',
  )
  const eventUrl = page.url()

  await page.getByRole('link', { name: 'Discover', exact: true }).click()
  const recommendations = page.getByRole('region', { name: 'Picked around your interests' })
  await expect(recommendations).toBeVisible()
  await expect(
    recommendations.getByRole('heading', { name: 'A real browser test event' }),
  ).toBeVisible()
  await page.goto(eventUrl)

  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  await register(guestPage, guestUsername)

  await guestPage.getByRole('link', { name: 'People', exact: true }).click()
  await guestPage.getByLabel('Search usernames').fill(hostUsername)
  const searchResponse = guestPage.waitForResponse(
    (response) => response.url().includes('/users/search?') && response.request().method() === 'GET',
  )
  await guestPage.getByRole('button', { name: 'Search' }).click()
  expect((await searchResponse).status()).toBe(200)
  await guestPage.getByRole('link', { name: `View ${hostUsername}'s profile` }).click()
  await expect(
    guestPage.getByRole('heading', { name: hostUsername, exact: true }),
  ).toBeVisible()
  await guestPage
    .getByRole('link', { name: 'A real browser test event', exact: true })
    .click()
  await expect(guestPage).toHaveURL(eventUrl)
  await expect(guestPage.getByRole('button', { name: 'Delete event' })).toHaveCount(0)

  await guestPage.getByRole('button', { name: 'Like event' }).click()
  await expect(guestPage.getByRole('button', { name: 'Unlike event' })).toBeVisible()
  const heartedEventsResponse = guestPage.waitForResponse(
    (response) =>
      response.url().endsWith('/auth/me/liked-posts') &&
      response.request().method() === 'GET',
  )
  await guestPage.getByRole('link', { name: 'Hearted', exact: true }).click()
  expect((await heartedEventsResponse).status()).toBe(200)
  await expect(guestPage.getByRole('heading', { name: 'Hearted events' })).toBeVisible()
  await expect(
    guestPage.getByRole('heading', { name: 'A real browser test event' }),
  ).toBeVisible()
  await guestPage
    .getByRole('link', { name: 'A real browser test event', exact: true })
    .click()
  await guestPage.getByLabel('Add to the conversation').fill('I will be there.')
  await guestPage.getByRole('button', { name: 'Post comment' }).click()
  await expect(guestPage.getByText('I will be there.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('I will be there.')).toBeVisible()
  await expect(
    page.getByRole('button', { name: `Delete comment by ${guestUsername}` }),
  ).toHaveCount(0)

  guestPage.once('dialog', (dialog) => dialog.accept())
  await guestPage
    .getByRole('button', { name: `Delete comment by ${guestUsername}` })
    .click()
  await expect(guestPage.getByText('I will be there.')).not.toBeVisible()
  await guestPage.getByRole('button', { name: 'Unlike event' }).click()
  await expect(guestPage.getByRole('button', { name: 'Like event' })).toBeVisible()
  await guestPage.getByRole('link', { name: 'Hearted', exact: true }).click()
  await expect(
    guestPage.getByRole('heading', { name: 'No hearted events yet' }),
  ).toBeVisible()
  await guestPage.getByRole('button', { name: 'Log out' }).click()
  await expect(guestPage).toHaveURL('http://127.0.0.1:5174/')
  await expect(guestPage.getByRole('link', { name: 'People', exact: true })).toHaveCount(0)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete event' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5174/')
  await guestContext.close()
})

test('backend registration errors are shown by the frontend', async ({ page }) => {
  const uniqueId = Date.now().toString().slice(-7)
  const username = `duplicate_${uniqueId}`

  await register(page, username)
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.goto('/register')
  await page.getByLabel(/^Username/).fill(username)
  await page.getByLabel('Email').fill(`second_${uniqueId}@example.com`)
  await page.getByLabel(/^Password/).fill('Password123!')

  const rejectedRegistration = page.waitForResponse(
    (response) => response.url().endsWith('/auth/register') && response.status() === 400,
  )
  await page.getByRole('button', { name: 'Create account' }).click()

  expect((await rejectedRegistration).status()).toBe(400)
  await expect(page.getByRole('alert')).toHaveText('Username already exists')
  await expect(page).toHaveURL('http://127.0.0.1:5174/register')
})

test('protected deep links preserve their destination and survive a refresh', async ({ page }) => {
  const uniqueId = Date.now().toString().slice(-7)
  const username = `returning_${uniqueId}`

  await page.goto('/people')
  await expect(page).toHaveURL('http://127.0.0.1:5174/login')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByLabel(/^Username/).fill(username)
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel(/^Password/).fill('Password123!')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL('http://127.0.0.1:5174/people')
  await expect(page.getByRole('heading', { name: 'Find people' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Find people' })).toBeVisible()
  await expect(page.getByRole('link', { name: username })).toBeVisible()
})
