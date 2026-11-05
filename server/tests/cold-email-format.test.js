const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPlainEmailHtml } = require("../utils/coldEmailEngine");

test("plain outreach email keeps paragraphs and signature compact without bottom padding", () => {
  const html = buildPlainEmailHtml(
    "Hi,\n\nFirst paragraph.\n\nKind regards,\nWilliam\nCleaniq Services",
    "https://example.com/unsubscribe",
  );

  assert.match(html, /<p style="margin:0 0 12px;">Hi,<\/p>/);
  assert.match(html, /Kind regards,<br>William<br>Cleaniq Services/);
  assert.match(html, /margin:16px 0 0;font-size:11px/);
  assert.doesNotMatch(html, /padding-bottom|<p><\/p>|<br><\/body>/);
});

test("plain outreach email escapes message markup", () => {
  const html = buildPlainEmailHtml(
    "Hi <customer> & welcome",
    "https://example.com/unsubscribe",
  );
  assert.match(html, /Hi &lt;customer&gt; &amp; welcome/);
});
