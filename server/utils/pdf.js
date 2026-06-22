const puppeteer = require("puppeteer");

let browserPromise = null;
// Reuse a single browser instance across requests instead of launching a
// fresh one (and downloading/booting Chromium) on every invoice download.
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

// Renders an HTML invoice snippet into a downloadable PDF buffer. The
// document <title> becomes the PDF's metadata title, so it shows
// "Cleaniq Services" in the PDF viewer/tab instead of a random filename.
async function htmlToPdfBuffer(innerHtml, title = "Cleaniq Services") {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const fullHtml = `<!DOCTYPE html>
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
    await page.close();
  }
}

module.exports = { htmlToPdfBuffer };
