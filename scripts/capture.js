// Capture desktop+mobile screenshots with precise exit codes (75 transient, 1 defect).
const fs = require("fs");
const path = require("path");
const os = require("os");

async function main() {
  const url = process.env.CAPTURE_URL;
  const output = process.env.CAPTURE_DIR;
  if (!url || !output) {
    console.error("Set CAPTURE_URL and CAPTURE_DIR.");
    process.exitCode = 1;
    return;
  }
  fs.mkdirSync(output, { recursive: true });
  const runtime = path.join(os.homedir(), ".local/share/omgithub-playwright");
  if (process.platform === "linux") {
    try {
      const d = fs.readFileSync(path.join(runtime, "display"), "utf8").trim();
      if (!process.env.DISPLAY) process.env.DISPLAY = ":" + d;
    } catch {}
  }
  const cfgPath = path.join(runtime, process.platform === "darwin" ? "metal.json" : "linux.json");
  const config = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const pwPath = path.join(runtime, "node_modules", "playwright");
  const { chromium } = require(pwPath);
  const transient = (err) => { throw Object.assign(err instanceof Error ? err : new Error(String(err)), { exitCode: 75 }); };
  let browser;
  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(transient);
    for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
      const page = await browser.newPage({ viewport: { width, height } }).catch(transient);
      page.setDefaultTimeout(30000);
      page.on("pageerror", (e) => console.error(e.message));
      const response = await page.goto(url, { waitUntil: "load", timeout: 45000 }).catch(transient);
      const status = response ? response.status() : 0;
      if (!response || !response.ok()) {
        const code = !response || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1;
        throw Object.assign(new Error(`HTTP ${status} loading preview`), { exitCode: code });
      }
      await page.locator("body").waitFor({ state: "visible" });
      await page.waitForFunction(() => document.fonts.status === "loaded");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(output, `final-${name}.png`), timeout: 30000 }).catch((error) => {
        if (error.name === "TimeoutError" || !browser.isConnected()) transient(error);
        throw error;
      });
      console.log(`capture ${name}: ok -> final-${name}.png`);
      await page.close();
    }
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exitCode = error && error.exitCode ? error.exitCode : 1;
  } finally {
    try { await browser?.close(); } catch (e) { console.error(e.message); process.exitCode = process.exitCode || 75; }
  }
}
main();
