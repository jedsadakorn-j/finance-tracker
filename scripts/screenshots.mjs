// Captures screenshots of the main pages (login + after-login flow).
// Usage: node scripts/screenshots.mjs [baseUrl] [password]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:5173";
const password = process.argv[3] ?? "finance123";
const outDir = "docs/screenshots";
mkdirSync(outDir, { recursive: true });

const shots = [];
async function shot(page, name) {
  const path = `${outDir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  shots.push(path);
}

const browser = await chromium.launch();

// Desktop viewport
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector('input[type="password"]');
await shot(page, "01-login");

await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
await page.waitForSelector("text=Dashboard", { timeout: 10000 });
await page.waitForTimeout(1200); // let charts render
await shot(page, "02-dashboard");

await page.click("text=Transactions");
await page.waitForSelector("text=record(s)");
await page.waitForTimeout(500);
await shot(page, "03-transactions");

await page.click("text=Reports");
await page.waitForSelector("text=Income vs Expense");
await page.waitForTimeout(1200);
await shot(page, "04-reports");

await page.click("text=Settings");
await page.waitForSelector("text=Add custom category");
await shot(page, "05-settings");

// Open Add modal back on dashboard for the "add transaction" shot
await page.click("text=Dashboard");
await page.waitForSelector("text=Expense by category");
await page.click("text=+ Add");
await page.waitForSelector("text=Add transaction");
await page.waitForTimeout(300);
await shot(page, "06-add-transaction");

await ctx.close();

// Mobile viewport (responsive proof)
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mctx.newPage();
await mpage.goto(base, { waitUntil: "networkidle" });
await mpage.fill('input[type="password"]', password);
await mpage.click('button[type="submit"]');
await mpage.getByRole("heading", { name: "Dashboard" }).waitFor();
await mpage.waitForTimeout(1200);
await shot(mpage, "07-mobile-dashboard");
await mctx.close();

await browser.close();
console.log("Saved:\n" + shots.join("\n"));
