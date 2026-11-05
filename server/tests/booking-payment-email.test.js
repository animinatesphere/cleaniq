const test = require("node:test");
const assert = require("node:assert/strict");
const { shouldSendPaymentCaptureEmail } = require("../utils/bookingPayments");

test("does not send a capture email after an authorized booking confirmation", () => {
  assert.equal(shouldSendPaymentCaptureEmail("Authorized"), false);
});

test("does not resend a capture email when Stripe retries a completed payment", () => {
  assert.equal(shouldSendPaymentCaptureEmail("Completed"), false);
});

test("sends a capture email for a payment not previously authorized or completed", () => {
  assert.equal(shouldSendPaymentCaptureEmail("Pending"), true);
});
