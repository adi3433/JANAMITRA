import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE = 'https://www.eci.gov.in/faq/{cat}/{page}';
const MAX_CATEGORY = 30;
const MAX_PAGE = 30;

function buildUrl(cat, page) {
  return BASE.replace('{cat}', String(cat)).replace('{page}', String(page));
}

async function run() {
  // ECI blocks headless/bot-like sessions; run real Chrome for reliable extraction.
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  const out = [];
  let attempted = 0;
  let succeeded = 0;
  let noData = 0;
  let failed = 0;

  for (let cat = 1; cat <= MAX_CATEGORY; cat += 1) {
    for (let pg = 1; pg <= MAX_PAGE; pg += 1) {
      attempted += 1;
      const url = buildUrl(cat, pg);
      try {
        const [faqRes] = await Promise.all([
          page.waitForResponse(
            (res) => res.url().includes('/eci-backend/public/api/get-faq-data'),
            { timeout: 15000 }
          ),
          page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }),
        ]);

        const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        if (/No\s+data\s+found/i.test(bodyText) || bodyText.length < 80) {
          noData += 1;
          console.log(`NoData ${url}`);
          continue;
        }

        const json = await faqRes.json().catch(() => null);
        const rows = Array.isArray(json?.message) ? json.message : [];

        if (!rows.length) {
          noData += 1;
          console.log(`NoRows ${url}`);
          continue;
        }

        succeeded += 1;
        for (const row of rows) {
          const question = String(row?.faq_question || '').replace(/\s+/g, ' ').trim();
          const answer = String(row?.faq_answer || '').replace(/\s+/g, ' ').trim();
          if (!question || !answer) continue;

          out.push({
            category: cat,
            page: pg,
            index: out.length + 1,
            question,
            answer,
            url,
            categoryName: String(row?.category_name || ''),
            subCategoryName: String(row?.sub_category_name || ''),
          });
        }

        console.log(`Scraped ${url} -> ${rows.length} items`);
      } catch {
        failed += 1;
        console.log(`Failed ${url}`);
        continue;
      }
    }
  }

  await browser.close();

  const unique = [];
  const seen = new Set();
  for (const item of out) {
    const key = `${item.question}|||${item.answer}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const dataDir = path.join(process.cwd(), 'src', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const jsonPath = path.join(dataDir, 'eci_faq_full.json');
  const txtPath = path.join(dataDir, 'eci_faq_full.txt');

  await fs.writeFile(jsonPath, JSON.stringify(unique, null, 2), 'utf8');

  const txtBlocks = unique.map((item) => [
    `CATEGORY: ${item.category}`,
    `PAGE: ${item.page}`,
    `Q: ${item.question}`,
    `A: ${item.answer}`,
    `SOURCE: ${item.url}`,
    '----------------------------------',
  ].join('\n'));

  await fs.writeFile(txtPath, txtBlocks.join('\n\n'), 'utf8');

  console.log(`DONE: ${unique.length} unique FAQ items`);
  console.log(`ATTEMPTED: ${attempted}, SUCCESS: ${succeeded}, NODATA: ${noData}, FAILED: ${failed}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`TXT: ${txtPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
