// Permanent worker-app download links, used in the staff welcome email and the website.
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

test("Android/iPhone links forward to the current app; the welcome email uses the permanent link", async () => {
  process.env.WORKER_ANDROID_APK_URL = "https://expo.dev/artifacts/eas/NEW.apk";
  delete require.cache[require.resolve("../../utils/appLinks")];
  const app = express();
  app.use("/api/app", require("../../routes/appLinks"));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/app`;
  try {
    const a = await fetch(`${base}/worker/android`, { redirect: "manual" });
    assert.equal(a.status, 302);
    assert.equal(a.headers.get("location"), "https://expo.dev/artifacts/eas/NEW.apk");
    assert.equal(a.headers.get("cache-control"), "no-store");
    const i = await fetch(`${base}/worker/ios`, { redirect: "manual" });
    assert.match(i.headers.get("location"), /apps\.apple\.com\/.*id6784165706/);

    const html = require("../../utils/cleaniqEmailTemplates").staffAppInvite({ firstName: "Sam", email: "s@test", tempPassword: "Pw1" });
    assert.match(html, /api\.cleaniqservices\.com\/api\/app\/worker\/android/);
    assert.match(html, /cleaniqservices\.com\/worker-app/);
    assert.doesNotMatch(html, /expo\.dev\/artifacts/); // never an expiring Expo link in emails
  } finally {
    server.close();
  }
});
