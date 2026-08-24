import { chromium } from 'playwright';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173';
const browserChannel = process.env.SMOKE_BROWSER;
const browser = await chromium.launch({
  headless: true,
  ...(browserChannel ? { channel: browserChannel } : {}),
});
const page = await browser.newPage();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Setup Your Sprint' }).waitFor();

  await page.getByRole('button', { name: 'Try Sample Sprint' }).click();
  await page.getByRole('heading', { name: 'Study Plan' }).waitFor();
  assert((await page.locator('main').innerText()).includes('6h'), 'Plan does not show the selected time budget');
  await page.getByRole('button', { name: 'Start Quiz — Cell Biology' }).click();
  await page.getByRole('heading', { name: 'Topic Quiz' }).waitFor();
  await page.getByText('Question 1 of 5').waitFor();

  for (let question = 0; question < 5; question += 1) {
    const shortAnswer = page.getByRole('textbox', { name: 'Type your answer…' });
    if (await shortAnswer.count()) {
      await shortAnswer.fill('review');
      await shortAnswer.press('Enter');
    } else {
      const optionButtons = page.locator('main button').filter({ hasText: /^[A-D]/ });
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
  await page.getByText(/Substantially Covered|Targeted Practice Needed|Review and Retry/).waitFor();
  await page.goto(`${baseUrl}/progress`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Progress' }).waitFor();
  await page.getByText('Cell Biology', { exact: true }).first().waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Cell Biology', { exact: true }).first().waitFor();

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Reset Sprint' }).click();
  await page.goto(`${baseUrl}/plan`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'No Plan Yet' }).waitFor();
  await page.goto(`${baseUrl}/quiz`, { waitUntil: 'networkidle' });
  await page.getByText('No topics yet').waitFor();
  console.log(`Smoke passed: ${baseUrl}`);
} catch (error) {
  const body = await page.locator('body').innerText().catch(() => '');
  console.error(`Smoke failed at ${page.url()} (${await page.title()})`);
  console.error(body.slice(0, 600).replace(/\s+/g, ' '));
  throw error;
} finally {
  await browser.close();
}
