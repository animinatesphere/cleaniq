const test = require("node:test");
const assert = require("node:assert/strict");
const { generateReply, toGeminiContents } = require("../utils/aiProvider");

test("maps roles, merges same-side turns and starts with the customer", () => {
  const contents = toGeminiContents([
    { role: "ai", text: "Hi! How can I help?" }, // leading AI greeting is dropped
    { role: "customer", text: "How much is a deep clean?" },
    { role: "customer", text: "For a 2 bed flat" },
    { role: "ai", text: "It's £24.90 per hour." },
    { role: "staff", text: "I'll confirm the exact quote." },
    { role: "customer", text: "  " }, // blank skipped
    { role: "customer", text: "Thanks" },
  ]);
  assert.deepEqual(contents, [
    { role: "user", parts: [{ text: "How much is a deep clean?\n\nFor a 2 bed flat" }] },
    { role: "model", parts: [{ text: "It's £24.90 per hour.\n\nI'll confirm the exact quote." }] },
    { role: "user", parts: [{ text: "Thanks" }] },
  ]);
});

const fakeClient = (response, capture = {}) => ({
  models: { generateContent: async (req) => { capture.req = req; return response; } },
});

test("sends the system instructions and returns trimmed text", async () => {
  const capture = {};
  const reply = await generateReply({
    system: "RULES",
    history: [{ role: "customer", text: "Hello" }],
    client: fakeClient({ text: "  Hi there!  " }, capture),
  });
  assert.equal(reply, "Hi there!");
  assert.equal(capture.req.config.systemInstruction, "RULES");
  assert.equal(capture.req.model, "gemini-3.8-flash");
  assert.deepEqual(capture.req.config.thinkingConfig, { thinkingLevel: "LOW" });
});

test("returns null when the provider gives no text (e.g. blocked)", async () => {
  const reply = await generateReply({
    system: "RULES",
    history: [{ role: "customer", text: "Hello" }],
    client: fakeClient({ text: undefined, promptFeedback: { blockReason: "SAFETY" } }),
  });
  assert.equal(reply, null);
});

const flakyClient = (failures, calls) => ({
  models: {
    generateContent: async (req) => {
      calls.push(req.model);
      const err = failures.shift();
      if (err) throw err;
      return { text: `ok from ${req.model}` };
    },
  },
});
const overloaded = () => Object.assign(new Error("high demand"), { status: 503 });
const base = { system: "RULES", history: [{ role: "customer", text: "Hi" }], retryDelays: [0, 0] };

test("retries the main model when it is overloaded", async () => {
  const calls = [];
  const reply = await generateReply({ ...base, client: flakyClient([overloaded()], calls) });
  assert.equal(reply, "ok from gemini-3.8-flash");
  assert.deepEqual(calls, ["gemini-3.8-flash", "gemini-3.8-flash"]);
});

test("falls back to the backup models in order when the main one stays overloaded", async () => {
  const calls = [];
  const reply = await generateReply({ ...base, client: flakyClient([overloaded(), overloaded(), overloaded(), overloaded()], calls) });
  assert.equal(reply, "ok from gemini-3.5-flash");
  assert.deepEqual(calls, ["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash"]);
});

test("quota exhausted (429) skips straight to the next model", async () => {
  const calls = [];
  const quota = () => Object.assign(new Error("quota"), { status: 429 });
  const reply = await generateReply({ ...base, client: flakyClient([quota(), quota()], calls) });
  assert.equal(reply, "ok from gemini-3.5-flash");
  assert.deepEqual(calls, ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash"]);
});

test("does not retry a bad request", async () => {
  const calls = [];
  const bad = Object.assign(new Error("invalid"), { status: 400 });
  await assert.rejects(generateReply({ ...base, client: flakyClient([bad], calls) }), /invalid/);
  assert.deepEqual(calls, ["gemini-3.8-flash"]);
});

test("gives up after the backup model also fails", async () => {
  const calls = [];
  await assert.rejects(
    generateReply({ ...base, client: flakyClient([overloaded(), overloaded(), overloaded(), overloaded(), overloaded()], calls) }),
    /high demand/,
  );
  assert.equal(calls.length, 5);
});

test("tool loop: runs the tool, returns the model's turn unchanged, then gives the final text", async () => {
  const requests = [];
  const modelTurn = { role: "model", parts: [{ functionCall: { id: "c1", name: "get_quote", args: { service: "Deep Clean", hours: 3 } }, thoughtSignature: "SIG" }] };
  const replies = [
    { functionCalls: [{ id: "c1", name: "get_quote", args: { service: "Deep Clean", hours: 3 } }], candidates: [{ content: modelTurn }] },
    { text: "That comes to £74.70." },
  ];
  const client = { models: { generateContent: async (req) => { requests.push(structuredClone(req)); return replies.shift(); } } };
  const toolCalls = [];
  const reply = await generateReply({
    system: "RULES",
    history: [{ role: "customer", text: "Quote for a 3h deep clean" }],
    tools: [{ name: "get_quote" }],
    runTool: async (name, args) => { toolCalls.push([name, args]); return { total: 74.7 }; },
    client,
    retryDelays: [0, 0],
  });
  assert.equal(reply, "That comes to £74.70.");
  assert.deepEqual(toolCalls, [["get_quote", { service: "Deep Clean", hours: 3 }]]);
  assert.deepEqual(requests[0].config.tools, [{ functionDeclarations: [{ name: "get_quote" }] }]);
  const second = requests[1].contents;
  assert.deepEqual(second[1], modelTurn); // thought signature preserved
  assert.deepEqual(second[2], { role: "user", parts: [{ functionResponse: { id: "c1", name: "get_quote", response: { total: 74.7 } } }] });
});
