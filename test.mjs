// Run with: node test.mjs
// Requires playwright: npx playwright install chromium
// Falls back to known npx cache path if 'playwright' not in PATH
let pw;
try { pw = await import('playwright'); } catch(e) {
  pw = await import('/Users/ethan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs');
}
const { chromium, devices, request: playwrightRequest } = pw;

const BASE = 'https://localhost:8822';
const results = [];
let passed = 0, failed = 0;

function log(label, ok, detail = '') {
  const sym = ok ? '✓' : '✗';
  console.log(`  ${sym} ${label}${detail ? ': ' + detail : ''}`);
  results.push({ label, ok, detail });
  if (ok) passed++; else failed++;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// Wait until at least `count` elements matching selector exist — uses string template to avoid serialization issues
async function waitForCount(page, selector, count = 1, timeout = 7000) {
  await page.waitForFunction(
    `document.querySelectorAll(${JSON.stringify(selector)}).length >= ${count}`,
    { timeout }
  ).catch(() => {});
}

async function runDesktop(browser) {
  console.log('\n── Desktop (1280×800) ──');
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 10000 });
  // Wait for sessions to load
  await waitForCount(page, '.card', 1);
  await page.screenshot({ path: '/tmp/amux_desktop_home.png', fullPage: false });

  const title = await page.title();
  log('Page title', title.includes('amux'), title);

  const sessionsTab = await page.$('#tab-sessions');
  log('Sessions tab exists', !!sessionsTab);

  const boardTab = await page.$('#tab-board');
  log('Board tab exists', !!boardTab);

  const calTab = await page.$('#tab-calendar');
  log('Calendar tab exists', !!calTab);

  // Navigate to Board
  await page.click('#tab-board');
  await waitForCount(page, '.board-card', 1);  // wait for at least one card to render
  await page.screenshot({ path: '/tmp/amux_desktop_board_session.png' });

  const boardView = await page.$('#board-view');
  const boardVisible = await boardView?.isVisible();
  log('Board view visible', !!boardVisible);

  // Default view is session-grouped — check board is rendered in some form
  const boardContainer = await page.$('#board-columns');
  const containerVisible = await boardContainer?.isVisible();
  log('Board container visible', !!containerVisible);

  // Switch to kanban (status) mode to test columns
  await page.$eval('#bv-status', el => el.click());
  await waitForCount(page, '.board-col', 3);
  await page.screenshot({ path: '/tmp/amux_desktop_board.png' });

  const cols = await page.$$('.board-col');
  log('Kanban columns rendered (status mode)', cols.length >= 3, `${cols.length} columns`);

  // Overflow-x: scroll in kanban mode
  const overflowX = await boardContainer?.evaluate(el => getComputedStyle(el).overflowX);
  log('Board horizontal scroll in kanban mode', overflowX === 'scroll', `overflow-x: ${overflowX}`);

  // Issues with due dates show calendar badge
  const dueBadges = await page.$$('.board-card-time');
  const dueText = await Promise.all(dueBadges.map(b => b.textContent()));
  const hasDueBadge = dueText.some(t => t.includes('📅'));
  log('Due date badges on board cards', hasDueBadge);

  // Navigate to Calendar
  await page.click('#tab-calendar');
  await waitForCount(page, '.cal-day-header', 7);
  await page.screenshot({ path: '/tmp/amux_desktop_calendar.png' });

  const calView = await page.$('#calendar-view');
  const calVisible = await calView?.isVisible();
  log('Calendar view visible', !!calVisible);

  const calGrid = await page.$('#cal-grid');
  const gridHTML = await calGrid?.innerHTML();
  log('Calendar grid populated', gridHTML && gridHTML.length > 200);

  const dayHeaders = await page.$$('.cal-day-header');
  log('Calendar day headers (7)', dayHeaders.length === 7, `${dayHeaders.length} headers`);

  const chips = await page.$$('.cal-chip');
  log('Calendar chips (issues on dates)', chips.length > 0, `${chips.length} chips`);

  const calTitle = await page.$eval('#cal-title', el => el.textContent);
  log('Calendar title set', calTitle.length > 3, calTitle);

  // Click a calendar chip via $eval to avoid stale handles
  if (chips.length > 0) {
    await page.$eval('.cal-chip', el => el.click());
    await wait(500);
    const detailOverlay = await page.$('#board-detail-overlay');
    const detailActive = await detailOverlay?.evaluate(el => el.classList.contains('active'));
    log('Board detail opens from calendar chip', !!detailActive);

    const dueVal = await page.$eval('#bd-due', el => el.value).catch(() => '');
    log('Due date pre-filled in detail', dueVal.length > 0, dueVal);

    await page.$eval('#board-detail-overlay .btn', el => el.click());
    await wait(400);
  }

  // iCal link present
  const icalLink = await page.$('a[href="/api/calendar.ics"]');
  log('iCal subscribe link present', !!icalLink);

  // Navigate to prev month
  await page.$eval('button[onclick="calPrev()"]', el => el.click());
  await wait(300);
  const calTitle2 = await page.$eval('#cal-title', el => el.textContent);
  log('Calendar prev month navigation', calTitle2 !== calTitle, `→ ${calTitle2}`);

  // Today button restores current month
  await page.$eval('#cal-today-btn', el => el.click());
  await wait(300);
  const calTitle3 = await page.$eval('#cal-title', el => el.textContent);
  log('Calendar Today button', calTitle3 === calTitle, calTitle3);

  // Click empty cell to open add form
  const cells = await page.$$('.cal-cell:not(.other-month)');
  if (cells.length > 5) {
    await page.$$eval('.cal-cell:not(.other-month)', cells => cells[5].click());
    await wait(400);
    const addOverlay = await page.$('#board-edit-overlay');
    const addActive = await addOverlay?.evaluate(el => el.classList.contains('active'));
    log('Add form opens from calendar cell click', !!addActive);

    const dueInAdd = await page.$eval('#be-due', el => el.value).catch(() => '');
    log('Due date pre-filled in add form', dueInAdd.length > 0, dueInAdd);

    const cancelBtn = await page.$('.be-cancel');
    if (cancelBtn) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await wait(200);
  }

  // Sessions tab — wait for cards to appear
  await page.click('#tab-sessions');
  await waitForCount(page, '.card', 1);
  const sessionCards = await page.$$('.card');
  log('Session cards render', sessionCards.length > 0, `${sessionCards.length} sessions`);

  await page.screenshot({ path: '/tmp/amux_desktop_sessions.png' });
  await ctx.close();
}

async function runMobile(browser) {
  console.log('\n── Mobile (iPhone 14, 390×844) ──');
  const iPhone = devices['iPhone 14'];
  const ctx = await browser.newContext({
    ...iPhone,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await waitForCount(page, '.card', 1);
  await page.screenshot({ path: '/tmp/amux_mobile_home.png' });

  const tabBar = await page.$('.tab-bar');
  const tabVisible = await tabBar?.isVisible();
  log('Tab bar visible on mobile', !!tabVisible);

  const tabs = await page.$$('.tab-bar button');
  log('All 3 tabs on mobile', tabs.length === 3, `${tabs.length} tabs`);

  const sessionCards = await page.$$('.card');
  log('Sessions render on mobile', sessionCards.length > 0, `${sessionCards.length} cards`);

  // Board on mobile — wait for board cards to load, then switch to kanban mode
  await page.click('#tab-board');
  await waitForCount(page, '.board-card', 1);
  await page.screenshot({ path: '/tmp/amux_mobile_board_session.png' });

  // Switch to kanban mode
  await page.$eval('#bv-status', el => el.click());
  await waitForCount(page, '.board-col', 3);
  await page.screenshot({ path: '/tmp/amux_mobile_board.png' });

  const boardCols = await page.$$('.board-col');
  log('Board columns on mobile', boardCols.length >= 3, `${boardCols.length} cols`);

  // Horizontal scroll in kanban mode
  const boardContainer = await page.$('#board-columns');
  const overflowX = await boardContainer?.evaluate(el => getComputedStyle(el).overflowX);
  log('Board horizontal scroll enabled on mobile', overflowX === 'scroll', `overflow-x: ${overflowX}`);

  // Click a board card to open detail on mobile
  const cards = await page.$$('.board-card');
  if (cards.length > 0) {
    await page.$eval('.board-card', el => el.click());
    await wait(600);
    const detail = await page.$('#board-detail-overlay');
    const detailActive = await detail?.evaluate(el => el.classList.contains('active'));
    log('Board detail opens on mobile', !!detailActive);

    const dueField = await page.$('#bd-due');
    const dueVisible = await dueField?.isVisible();
    log('Due date field visible in detail on mobile', !!dueVisible);

    await page.$eval('#board-detail-overlay .btn', el => el.click());
    await wait(400);
    await page.screenshot({ path: '/tmp/amux_mobile_board_after_detail.png' });

    const containerAfter = await page.$('#board-columns');
    const overflowAfter = await containerAfter?.evaluate(el => getComputedStyle(el).overflowX);
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    log('Body overflow restored after detail close', bodyOverflow === '', `body.overflow="${bodyOverflow}"`);
    log('Board scroll intact after detail close', overflowAfter === 'scroll', `overflow-x: ${overflowAfter}`);
  }

  // Calendar on mobile
  await page.click('#tab-calendar');
  await waitForCount(page, '.cal-day-header', 7);
  await page.screenshot({ path: '/tmp/amux_mobile_calendar.png' });

  const calGrid = await page.$('#cal-grid');
  const calVisible = await calGrid?.isVisible();
  log('Calendar grid visible on mobile', !!calVisible);

  const firstCell = await page.$('.cal-cell');
  const cellHeight = await firstCell?.evaluate(el => el.getBoundingClientRect().height);
  log('Calendar cells have height on mobile', cellHeight > 40, `height: ${Math.round(cellHeight)}px`);

  const chips = await page.$$('.cal-chip');
  log('Calendar chips visible on mobile', chips.length > 0, `${chips.length} chips`);

  const toolbar = await page.$('.cal-toolbar');
  const toolbarWidth = await toolbar?.evaluate(el => el.scrollWidth);
  const viewportWidth = 390;
  log('Calendar toolbar fits mobile viewport', toolbarWidth <= viewportWidth + 10, `scrollWidth: ${toolbarWidth}`);

  await page.screenshot({ path: '/tmp/amux_mobile_calendar_final.png' });
  await ctx.close();
}

async function testSync() {
  console.log('\n── Sync Protocol Tests ──');

  const api = await playwrightRequest.newContext({ ignoreHTTPSErrors: true, baseURL: BASE });

  const r0 = await api.get('/api/sync?since=0');
  const d0 = await r0.json();
  log('GET /api/sync?since=0 returns correct shape',
    Array.isArray(d0.issues) && Array.isArray(d0.statuses) && d0.ts > 0,
    `${d0.issues.length} issues, ${d0.statuses.length} statuses, ts=${d0.ts}`
  );

  const alive = d0.issues.filter(i => !i.deleted);
  const deleted = d0.issues.filter(i => i.deleted);
  log('Sync includes soft-deleted tombstones', deleted.length > 0, `alive:${alive.length} deleted:${deleted.length}`);

  const ts = d0.ts - 10;
  const r1 = await api.get(`/api/sync?since=${ts}`);
  const d1 = await r1.json();
  log('GET /api/sync?since=recent returns fewer results', d1.issues.length <= d0.issues.length,
    `since=${ts}: ${d1.issues.length} issues`);

  const rCal = await api.get('/api/calendar.ics');
  const ical = await rCal.text();
  log('iCal Content-Type correct', rCal.headers()['content-type']?.includes('text/calendar'), rCal.headers()['content-type']);
  log('iCal has VCALENDAR wrapper', ical.includes('BEGIN:VCALENDAR') && ical.includes('END:VCALENDAR'));
  log('iCal has VEVENT for dated issues', ical.includes('BEGIN:VEVENT'), `${(ical.match(/BEGIN:VEVENT/g)||[]).length} events`);
  log('iCal DTSTART uses DATE format', ical.includes('DTSTART;VALUE=DATE:'));

  const now = Math.floor(Date.now() / 1000);
  const rCreate = await api.post('/api/board', {
    data: { title: 'Sync test issue', session: 'amux', due: '2026-03-15' }
  });
  const created = await rCreate.json();
  log('Board POST creates issue', rCreate.status() === 201, `id=${created.id}`);

  const rSync2 = await api.get(`/api/sync?since=${now - 1}`);
  const d2 = await rSync2.json();
  const syncedItem = d2.issues.find(i => i.id === created.id);
  log('New issue appears in delta sync', !!syncedItem, syncedItem?.id);

  await api.delete(`/api/board/${created.id}`);

  const rSync3 = await api.get(`/api/sync?since=${now - 1}`);
  const d3 = await rSync3.json();
  const tombstone = d3.issues.find(i => i.id === created.id);
  log('Deleted issue appears as tombstone in sync', tombstone?.deleted > 0, `deleted=${tombstone?.deleted}`);

  await api.dispose();
}

// Main
const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });

try {
  await runDesktop(browser);
  await runMobile(browser);
  await testSync();
} catch(e) {
  console.error('Test error:', e.message);
  console.error(e.stack);
  failed++;
} finally {
  await browser.close();
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => !r.ok).forEach(r => console.log(`  ✗ ${r.label}: ${r.detail}`));
}
process.exit(failed > 0 ? 1 : 0);
