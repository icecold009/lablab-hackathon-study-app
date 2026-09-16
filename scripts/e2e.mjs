import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const browserChannel = process.env.E2E_BROWSER || 'msedge'
const configuredBaseUrl = process.env.E2E_BASE_URL

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function findFreePort(start = 4173) {
  for (let port = start; port < start + 100; port += 1) {
    const available = await new Promise(resolvePort => {
      const server = createServer()
      server.once('error', () => resolvePort(false))
      server.listen(port, '127.0.0.1', () => server.close(() => resolvePort(true)))
    })
    if (available) return port
  }
  throw new Error('Could not find a free local port for the E2E server.')
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 30_000
  let lastError = 'server did not respond'
  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`E2E server exited before becoming ready (code ${child.exitCode}).`)
    }
    try {
      const response = await fetch(`${baseUrl}/`)
      if (response.ok) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 150))
  }
  throw new Error(`E2E server was not ready: ${lastError}`)
}

async function startServer() {
  if (configuredBaseUrl) return { baseUrl: configuredBaseUrl.replace(/\/$/, ''), child: null }

  const port = await findFreePort()
  const viteBin = resolve(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: repoRoot,
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  const baseUrl = `http://127.0.0.1:${port}`
  await waitForServer(baseUrl, child)
  return { baseUrl, child }
}

function stopServer(child) {
  if (!child || child.killed) return
  child.kill()
}

function wireNetworkGuards(context, baseOrigin) {
  const externalRequests = []
  const consoleIssues = []
  const pageErrors = []

  context.route('**/*', async route => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.origin !== baseOrigin) {
      externalRequests.push(requestUrl.href)
      await route.abort()
      return
    }
    await route.continue()
  })
  context.on('console', message => {
    if (message.type() === 'error') consoleIssues.push(message.text())
  })
  context.on('page', page => page.on('pageerror', error => pageErrors.push(error.message)))

  return { externalRequests, consoleIssues, pageErrors }
}

async function assertClean(label, diagnostics) {
  assert(diagnostics.externalRequests.length === 0, `${label} attempted external network access: ${diagnostics.externalRequests.join(', ')}`)
  assert(diagnostics.consoleIssues.length === 0, `${label} emitted console errors: ${diagnostics.consoleIssues.join(' | ')}`)
  assert(diagnostics.pageErrors.length === 0, `${label} emitted page errors: ${diagnostics.pageErrors.join(' | ')}`)
}

async function answerCurrentQuestion(page, useKeyboard = false) {
  const isMultipleChoice = await page.getByText('Multiple Choice', { exact: true }).count() > 0
  if (isMultipleChoice) {
    if (useKeyboard) {
      await page.keyboard.press('1')
    } else {
      const options = page.locator('main button').filter({ hasText: /^[A-D]/ })
      assert(await options.count() > 0, 'No multiple-choice answer options were rendered.')
      await options.first().click()
    }
    await page.getByRole('button', { name: 'Submit Answer' }).click()
  } else {
    const answer = page.getByRole('textbox', { name: 'Type your answer…' })
    await answer.fill('review')
    await answer.press('Enter')
  }
  await page.locator('p').filter({ hasText: /^(Correct!|Incorrect)$/ }).waitFor()
}

async function finishQuiz(page, startAt = 0) {
  for (let question = startAt; question < 5; question += 1) {
    if (question > startAt) {
      await page.getByText(`Question ${question + 1} of 5`).waitFor()
    }
    await answerCurrentQuestion(page)
    if (question < 4) {
      await page.getByRole('button', { name: 'Next' }).click()
    } else {
      await page.getByRole('button', { name: 'Finish Quiz' }).click()
    }
  }
  await page.getByText(/of 5 correct/).waitFor()
}

async function runPrimaryJourney(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  })
  const diagnostics = wireNetworkGuards(context, new URL(baseUrl).origin)
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Setup Your Sprint' }).waitFor()
    await page.getByRole('button', { name: 'Try Sample Sprint' }).click()
    await page.getByRole('heading', { name: 'Study Plan' }).waitFor()
    assert((await page.locator('main').innerText()).includes('6h'), 'Sample plan did not preserve its six-hour budget.')

    const startTimer = page.getByRole('button', { name: 'Start timer' }).first()
    await startTimer.click()
    await page.getByRole('button', { name: 'Pause timer' }).first().waitFor()
    const runningTimer = await page.evaluate(() => JSON.parse(localStorage.getItem('icecold-active-timer') || 'null'))
    assert(runningTimer?.version === 1 && runningTimer.data.running === true, 'Running timer was not persisted in a versioned envelope.')

    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Pause timer' }).first().waitFor()
    await page.getByRole('button', { name: 'Pause timer' }).first().click()
    await page.getByRole('button', { name: 'Resume timer' }).first().waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Resume timer' }).first().waitFor()

    await page.getByRole('button', { name: 'Start Quiz — Cell Biology' }).click()
    await page.getByRole('heading', { name: 'Topic Quiz' }).waitFor()
    await page.getByText('Question 1 of 5').waitFor()
    await answerCurrentQuestion(page, true)
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByText('Question 2 of 5').waitFor()
    await answerCurrentQuestion(page)
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByText('Question 2 of 5').waitFor()
    await page.locator('p').filter({ hasText: /^(Correct!|Incorrect)$/ }).waitFor()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByText('Question 3 of 5').waitFor()
    await finishQuiz(page, 2)

    await page.getByRole('button', { name: 'Retry Quiz' }).click()
    await page.getByText('Question 1 of 5').waitFor()
    await answerCurrentQuestion(page)
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByText('Question 1 of 5').waitFor()
    await page.locator('p').filter({ hasText: /^(Correct!|Incorrect)$/ }).waitFor()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByText('Question 2 of 5').waitFor()
    await finishQuiz(page, 1)

    const quizResults = await page.evaluate(() => JSON.parse(localStorage.getItem('icecold-quiz-results') || 'null'))
    assert(quizResults?.version === 1 && quizResults.data.length === 2, 'Quiz retry did not preserve both completed results.')

    await page.goto(`${baseUrl}/progress`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Progress' }).waitFor()
    await page.getByText('Cell Biology', { exact: true }).first().waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByText('Cell Biology', { exact: true }).first().waitFor()

    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Reset Sprint' }).click()
    await page.goto(`${baseUrl}/plan`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'No Plan Yet' }).waitFor()
    await page.goto(`${baseUrl}/quiz`, { waitUntil: 'networkidle' })
    await page.getByText('No topics yet').waitFor()
    const transientStorage = await page.evaluate(() => ({
      timer: localStorage.getItem('icecold-active-timer'),
      quiz: localStorage.getItem('icecold-active-quiz'),
    }))
    assert(transientStorage.timer === null && transientStorage.quiz === null, 'Reset left transient timer or quiz state behind.')

    await assertClean('primary journey', diagnostics)
  } catch (error) {
    const body = await page.locator('body').innerText().catch(() => '')
    const storage = await page.evaluate(() => Object.fromEntries(
      Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]),
    )).catch(() => ({}))
    console.error(`E2E failed at ${page.url()} (${await page.title()})`)
    console.error(body.slice(0, 800).replace(/\s+/g, ' '))
    console.error(`Storage: ${JSON.stringify(storage)}`)
    throw error
  } finally {
    await context.close()
  }
}

async function runMobileJourney(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const diagnostics = wireNetworkGuards(context, new URL(baseUrl).origin)
  const page = await context.newPage()
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Try Sample Sprint' }).click()
    await page.getByRole('heading', { name: 'Study Plan' }).waitFor()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert(!overflow, 'Study plan overflows the 390px mobile viewport.')
    await assertClean('mobile journey', diagnostics)
  } finally {
    await context.close()
  }
}

async function runStorageRecovery(browser, baseUrl) {
  const corruptContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const corruptDiagnostics = wireNetworkGuards(corruptContext, new URL(baseUrl).origin)
  const corruptPage = await corruptContext.newPage()
  await corruptPage.addInitScript(() => {
    localStorage.setItem('icecold-setup', '{not-json')
    localStorage.setItem('icecold-plan', JSON.stringify({ version: 1, data: { invalid: true } }))
  })
  try {
    await corruptPage.goto(`${baseUrl}/plan`, { waitUntil: 'networkidle' })
    await corruptPage.getByRole('heading', { name: 'No Plan Yet' }).waitFor()
    await corruptPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
    await corruptPage.getByRole('button', { name: 'Try Sample Sprint' }).click()
    await corruptPage.getByRole('heading', { name: 'Study Plan' }).waitFor()
    await assertClean('corrupt recovery', corruptDiagnostics)
  } finally {
    await corruptContext.close()
  }

  const legacySetup = {
    examName: 'Legacy Biology',
    examHours: 12,
    studyHours: 4,
    topics: [{ id: 'legacy-cell', name: 'Cell Biology', confidence: 'low', importance: 'high' }],
    generatedAt: '2026-01-01T00:00:00.000Z',
  }
  const legacyContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const legacyDiagnostics = wireNetworkGuards(legacyContext, new URL(baseUrl).origin)
  const legacyPage = await legacyContext.newPage()
  await legacyPage.addInitScript(({ setup }) => {
    localStorage.setItem('icecold-setup', JSON.stringify(setup))
  }, { setup: legacySetup })
  try {
    await legacyPage.goto(`${baseUrl}/quiz`, { waitUntil: 'networkidle' })
    await legacyPage.getByRole('button', { name: /Cell Biology.*Start Quiz/ }).waitFor()
    const migrated = await legacyPage.evaluate(() => JSON.parse(localStorage.getItem('icecold-setup') || 'null'))
    assert(migrated?.version === 1 && migrated.data.examName === 'Legacy Biology', 'Valid legacy setup was not migrated to version 1.')
    await assertClean('legacy recovery', legacyDiagnostics)
  } finally {
    await legacyContext.close()
  }
}

async function runStorageFailure(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const diagnostics = wireNetworkGuards(context, new URL(baseUrl).origin)
  await context.addInitScript(() => {
    Storage.prototype.setItem = function setItemBlocked() {
      throw new DOMException('Storage is blocked', 'QuotaExceededError')
    }
  })
  const page = await context.newPage()
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Try Sample Sprint' }).click()
    await page.getByRole('status').getByText('Browser storage is unavailable.').waitFor()
    await assertClean('storage failure', diagnostics)
  } finally {
    await context.close()
  }
}

const server = await startServer()
let browser
try {
  browser = await chromium.launch({ headless: true, channel: browserChannel })
  await runPrimaryJourney(browser, server.baseUrl)
  await runMobileJourney(browser, server.baseUrl)
  await runStorageRecovery(browser, server.baseUrl)
  await runStorageFailure(browser, server.baseUrl)
  console.log(`E2E passed: ${server.baseUrl} (${browserChannel})`)
} finally {
  await browser?.close()
  stopServer(server.child)
}
