const puppeteer = require("puppeteer");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME_PATHS = [
  undefined, // use Puppeteer's bundled Chromium first
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
];

async function htmlToPdfBuffer(innerHtml, title = "Cleaniq Services") {
  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "cleaniq-invoice-pdf-"),
  );

  let browser;
  let lastErr;

  for (const executablePath of CHROME_PATHS) {
    try {
      const launchOpts = {
        headless: true,
        userDataDir,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--single-process",
        ],
      };
      if (executablePath) launchOpts.executablePath = executablePath;
      browser = await puppeteer.launch(launchOpts);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`PDF: browser launch failed (${executablePath || "bundled"}): ${err.message}`);
    }
  }

  if (!browser) throw lastErr || new Error("No usable browser found for PDF generation");

  try {
    const page = await browser.newPage();
    const isFullDoc = innerHtml.trim().toLowerCase().startsWith("<!doctype");
    const fullHtml = isFullDoc
      ? innerHtml
      : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;">${innerHtml}</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "0px", right: "0px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
    fs.rm(userDataDir, { recursive: true, force: true }, () => {});
  }
}

module.exports = { htmlToPdfBuffer };
