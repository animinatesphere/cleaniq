const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractDomainFromEmail,
  resolveContactDomain,
} = require("../utils/contactDomain");

test("extracts the domain from an email address", () => {
  assert.equal(
    extractDomainFromEmail("peter.taylor@keyletmanagement.co.uk"),
    "keyletmanagement.co.uk",
  );
  assert.equal(
    extractDomainFromEmail("thewoodthorpe@joseph-holt.com"),
    "joseph-holt.com",
  );
  assert.equal(
    extractDomainFromEmail("churchstreet@supercityuk.com"),
    "supercityuk.com",
  );
});

test("uses the provided domain when present, otherwise falls back to the email domain", () => {
  assert.equal(
    resolveContactDomain("https://example.com", "someone@example.org"),
    "example.com",
  );
  assert.equal(resolveContactDomain("", "someone@acme.co.uk"), "acme.co.uk");
  assert.equal(resolveContactDomain("   ", "someone@acme.co.uk"), "acme.co.uk");
});
