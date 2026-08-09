import { chromium } from 'playwright';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Setup Your Sprint' }).waitFor();

  await page.getByRole('button', { name: 'Try Sample Sprint' }).click();
  await page.getByRole('heading', { name: 'Study Plan' }).waitFor();
  await page.getByRole('button', { name: 'Start Quiz — Cell Biology' }).click();
  await page.getByRole('heading', { name: 'Topic Quiz' }).waitFor();
  await page.getByText('Question 1 of 5').waitFor();

  for (let question = 0; question < 5; question += 1) {
    const shortAnswer = page.getByRole('textbox', { name: 'Type your answer…' });
    if (await shortAnswer.count()) {
      await shortAnswer.fill('review');
      await shortAnswer.press('Enter');
    } else {
      const optionButtons = page.locator('main button').filter({ hasText: /^[A-D]\s/ });
      assert(await optionButtons.count() > 0, `No answer options found for question ${question + 1}`);
      await optionButtons.first().click();
      await page.getByRole('button', { name: 'Submit Answer' }).click();
    }

    if (question < 4) {
      await page.getByRole('button', { name: 'Next' }).click();
    } else {
      await page.getByRole('button', { name: 'Finish Quiz' }).click();
    }
  }

  await page.getByText(/of 5 correct/).waitFor();
  await page.goto(`${baseUrl}/progress`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Progress' }).waitFor();
  console.log(`Smoke passed: ${baseUrl}`);
} finally {
  await browser.close();
}
