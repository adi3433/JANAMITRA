import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const SHOULD_START_SERVER = process.env.E2E_START_SERVER !== '0' && !process.argv.includes('--no-server');
const HEADLESS = process.env.PW_HEADLESS !== '0';
const SERVER_TIMEOUT_MS = 120000;

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok || response.status === 404) return;
    } catch {
      // Server not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  throw new Error(`Timed out waiting for server at ${url}`);
}

function startDevServer() {
  const child = spawn(npmCommand(), ['run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: '3000' },
  });

  return child;
}

async function stopDevServer(child) {
  if (!child || child.killed) return;

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  child.kill('SIGTERM');
}

async function assertVisible(locator, description, timeout = 20000) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout });
  } catch {
    throw new Error(`Expected visible: ${description}`);
  }
}

async function assertHidden(locator, description, timeout = 12000) {
  try {
    await locator.first().waitFor({ state: 'hidden', timeout });
  } catch {
    throw new Error(`Expected hidden: ${description}`);
  }
}

async function runDesktopFlow(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  await assertVisible(page.getByText('Approved Questions List'), 'approved list heading');

  const searchInput = page.getByLabel('Search approved questions');
  await assertVisible(searchInput, 'question search input');

  await searchInput.fill('sveep');
  await assertVisible(page.getByRole('button', { name: 'What is SVEEP?' }), 'SVEEP question button');
  await page.getByRole('button', { name: 'What is SVEEP?' }).click();

  await assertVisible(
    page.getByText(/Confidence:|Answer Based On ECI FAQ|ECI FAQ/i),
    'assistant response marker'
  );

  await page.getByRole('button', { name: 'Collapse question list' }).click();
  await assertHidden(searchInput, 'search input after collapse');

  await assertVisible(page.getByRole('button', { name: 'Show question list' }), 'show toggle after collapse');
  await page.getByRole('button', { name: 'Show question list' }).click();
  await assertVisible(searchInput, 'search input after re-open');

  await page.getByRole('button', { name: 'Registration', exact: true }).click();
  await searchInput.fill('sveep');
  await assertVisible(
    page.getByRole('button', { name: 'What is SVEEP?' }),
    'SVEEP visible after search auto-resets to all sections'
  );

  await context.close();
}

async function runMobileFlow(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });

  // Close sidebar overlay if open, otherwise question taps are blocked.
  const mobileSidebar = page.locator('aside.fixed.inset-y-0.left-0.z-50').first();
  const mobileBackdrop = page.locator('div.fixed.inset-0.z-40.bg-black').first();

  for (let i = 0; i < 3; i += 1) {
    const sidebarVisible = await mobileSidebar.isVisible().catch(() => false);
    if (!sidebarVisible) break;

    const closeSidebarButton = page.getByRole('button', { name: 'Close sidebar' }).first();
    if (await closeSidebarButton.isVisible().catch(() => false)) {
      await closeSidebarButton.click();
    } else if (await mobileBackdrop.isVisible().catch(() => false)) {
      await mobileBackdrop.click({ position: { x: 10, y: 10 } });
    } else {
      const toggleSidebarButton = page.getByRole('button', { name: 'Toggle sidebar' }).first();
      if (await toggleSidebarButton.isVisible().catch(() => false)) {
        await toggleSidebarButton.click();
      }
    }

    await page.waitForTimeout(150);
  }

  if (await mobileSidebar.isVisible().catch(() => false)) {
    throw new Error('Mobile sidebar remained open and blocked question list interactions.');
  }

  await assertVisible(page.getByText('Approved Questions List'), 'approved list heading (mobile)');

  const searchInput = page.getByLabel('Search approved questions');
  await searchInput.fill('sveep');
  const sveepQuestion = page.getByRole('button', { name: 'What is SVEEP?' }).first();
  await assertVisible(sveepQuestion, 'SVEEP question button (mobile)');
  await sveepQuestion.click({ force: true });

  // Mobile behavior: panel auto-collapses after selecting a question.
  await assertVisible(page.getByRole('button', { name: 'Show question list' }), 'mobile auto-collapse toggle');
  await assertHidden(searchInput, 'mobile search hidden after question click');

  const responseMarker = page.getByText(/Confidence:|Answer Based On ECI FAQ|ECI FAQ/i).first();
  await assertVisible(responseMarker, 'mobile assistant response marker');

  const confidenceInViewport = await responseMarker.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });

  if (!confidenceInViewport) {
    throw new Error('Expected conversation to scroll into viewport after selecting question on mobile.');
  }

  await context.close();
}

async function main() {
  let server = null;
  let browser = null;

  try {
    if (SHOULD_START_SERVER) {
      console.log('[e2e] starting dev server...');
      server = startDevServer();
      await waitForServer(`${BASE_URL}/chat`, SERVER_TIMEOUT_MS);
      console.log('[e2e] dev server ready');
    }

    browser = await chromium.launch({ headless: HEADLESS });

    console.log('[e2e] running desktop question flow...');
    await runDesktopFlow(browser);

    console.log('[e2e] running mobile question flow...');
    await runMobileFlow(browser);

    console.log('[e2e] question flows passed');
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

main().catch((error) => {
  console.error('[e2e] question flow failed:', error);
  process.exit(1);
});
