#!/usr/bin/env node
/**
 * Basic automated accessibility & contrast audit using Playwright + axe-core.
 * - Launches dev server (if not running) OR you can pre-run `npm run dev` in another terminal.
 * - Visits a small set of representative routes.
 * - Injects axe and reports violations (filtered to serious/critical by default, toggle with CLI flag).
 * - Checks color contrast failures explicitly.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const DEV_ORIGIN = process.env.A11Y_BASE || 'http://localhost:5173';
const ROUTES = [ '/', '/login', '/profile', '/numerology/name-number' ];
// Theme variants to audit: day vs night; each with optional high contrast
const VARIANTS = [
  { theme: 'day', highContrast: false },
  { theme: 'day', highContrast: true },
  { theme: 'night', highContrast: false },
  { theme: 'night', highContrast: true }
];
const REPORT_DIR = path.join(process.cwd(), 'a11y-reports');
const HEADLESS = process.env.HEADLESS !== 'false';
const SEVERITY = process.env.A11Y_SEVERITY || 'serious'; // one of: minor, moderate, serious, critical
const severities = ['minor','moderate','serious','critical'];

if (!severities.includes(SEVERITY)) {
  console.error(`Invalid A11Y_SEVERITY ${SEVERITY}. Valid: ${severities.join(', ')}`);
  process.exit(2);
}

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

// Dynamically load axe-core source (ESM safe inline injection)
const axePath = path.dirname(require.resolve('axe-core/package.json'));
const axeSource = fs.readFileSync(path.join(axePath, 'axe.min.js'), 'utf8');

async function ensureDevServer() {
  // Ping origin; if fails, spawn dev
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 1500);
  try {
    const res = await fetch(DEV_ORIGIN, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return null; // assume running
  } catch {
    clearTimeout(timeout);
  }
  console.log('Dev server not detected, starting Vite...');
  const proc = spawn('npm', ['run','dev'], { cwd: process.cwd(), stdio: 'inherit', shell: true });
  // crude wait for Vite ready
  await new Promise(r => setTimeout(r, 4000));
  return proc;
}

async function applyVariant(page, variant) {
  // Inject preferences BEFORE page scripts execute on navigation
  await page.addInitScript(({ theme, highContrast }) => {
    try {
      localStorage.setItem('pref:theme', theme);
      localStorage.setItem('pref:highContrast', String(highContrast));
    } catch {}
    // Pre-set classes to minimize FOUC
    const root = document.documentElement;
    if (theme === 'night') root.classList.add('dark'); else root.classList.remove('dark');
    if (highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
  }, variant);
}

function variantId(v){ return `${v.theme}${v.highContrast?'-high-contrast':''}`; }

async function auditRoute(page, route, variant) {
  const url = DEV_ORIGIN + route;
  // Clear previous init scripts (new context with same page is simpler than removing; we can create a new page per variant for isolation)
  await page.goto('about:blank');
  await applyVariant(page, variant);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Wait for root app mount
  await page.waitForSelector('#root', { timeout: 5000 }).catch(()=>{});
  // Allow Tailwind & dynamic CSS to settle and ensure primary button styles applied if present
  await page.waitForTimeout(350);
  // If a primary button exists, wait until its computed background is not near-white (heuristic for style readiness)
  const btnExists = await page.$('.btn-primary');
  if (btnExists) {
    await page.waitForFunction(() => {
      const el = document.querySelector('.btn-primary');
      if (!el) return true; // nothing to wait for
      const bg = getComputedStyle(el).backgroundColor;
      // Parse rgb
      const m = bg.match(/rgba?\((\d+), (\d+), (\d+)/);
      if (!m) return true;
      const r = parseInt(m[1],10), g = parseInt(m[2],10), b = parseInt(m[3],10);
      // brand-600 approx rgb(79,70,229) => avg 126; near-white > 230
      const avg = (r+g+b)/3;
      return avg < 225; // ensure not extremely light
    }, { timeout: 1500 }).catch(()=>{});
  }
  await page.addScriptTag({ content: axeSource });
  const axeResult = await page.evaluate(async (severity) => {
    const context = { include: ['body'] };
    const options = { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } };
    const r = await window.axe.run(context, options);
    const order = ['minor','moderate','serious','critical'];
    const thresholdIndex = order.indexOf(severity);
    r.violations = r.violations.filter(v => order.indexOf(v.impact || 'minor') >= thresholdIndex);
    return r;
  }, SEVERITY);
  return { route, axeResult, variant: variantId(variant) };
}

(async () => {
  const serverProc = await ensureDevServer();
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  const results = [];
  for (const variant of VARIANTS) {
    console.log(`\n=== Variant: ${variantId(variant)} ===`);
    for (const r of ROUTES) {
      try {
        console.log(`Auditing ${r}`);
        const res = await auditRoute(page, r, variant);
        results.push(res);
      } catch (e) {
        console.error(`Failed auditing ${r}:`, e.message);
        results.push({ route: r, variant: variantId(variant), error: e.message });
      }
    }
  }
  await browser.close();
  if (serverProc) serverProc.kill('SIGINT');

  const summary = {
    generatedAt: new Date().toISOString(),
    base: DEV_ORIGIN,
    severityFilter: SEVERITY,
    routes: results.map(r => ({
      route: r.route,
      variant: r.variant,
      error: r.error,
      violations: r.axeResult ? r.axeResult.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary }))
      })) : []
    }))
  };

  const outPath = path.join(REPORT_DIR, `a11y-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

  const totalViolations = summary.routes.reduce((acc, r) => acc + (r.violations?.length || 0), 0);
  const byVariant = summary.routes.reduce((m,r)=>{m[r.variant]=(m[r.variant]||0)+(r.violations?.length||0);return m;},{});
  console.log(`Accessibility audit complete. Violations (>= ${SEVERITY}): ${totalViolations}`);
  Object.entries(byVariant).forEach(([v,c])=>console.log(`  - ${v}: ${c}`));
  console.log(`Report: ${outPath}`);
  if (totalViolations > 0) {
    console.log('List of violation IDs:');
    [...new Set(summary.routes.flatMap(r => r.violations.map(v => v.id)))].forEach(id => console.log(' -', id));
  }
  // Non-zero exit if serious issues found when severity filter is serious/critical
  if (totalViolations > 0 && ['serious','critical'].includes(SEVERITY)) process.exitCode = 1;
})();
