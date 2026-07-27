const puppeteer = require("puppeteer");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Renders an HTML invoice snippet into a downloadable PDF buffer. The
// document <title> becomes the PDF's metadata title, so it shows
// "Cleaniq Services" in the PDF viewer/tab instead of a random filename.
//
// A fresh browser + unique profile directory is used per call (instead of a
// long-lived shared instance) so a leftover/orphaned Chromium process from a
// previous run can never collide with — and block — a new launch.
async function htmlToPdfBuffer(innerHtml, title = "Cleaniq Services") {
  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "cleaniq-invoice-pdf-"),
  );

  const browser = await puppeteer.launch({
    headless: true,
    userDataDir,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const isFullDoc = innerHtml.trim().toLowerCase().startsWith("<!doctype");
    const fullHtml = isFullDoc ? innerHtml : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin: 0;">${innerHtml}</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "0px", right: "0px" },
    });
    return pdf;
  } finally {
    await browser.close();
    fs.rm(userDataDir, { recursive: true, force: true }, () => {});
  }
}

module.exports = { htmlToPdfBuffer };
