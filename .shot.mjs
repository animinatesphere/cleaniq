import puppeteer from "puppeteer";
const out = process.argv[2];
const b = await puppeteer.launch({ headless: true });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 1100 });
const errors = []; p.on("pageerror", (e) => { if (!/Stripe\(\)/.test(e.message)) errors.push(e.message); });
await p.setRequestInterception(true);
p.on("request", (r) => (/google|clarity|facebook/.test(r.url()) ? r.abort() : r.continue()));
await p.goto("http://localhost:4173/booking?step=2", { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (pred) => p.evaluate((src) => { const f = new Function("b", `return ${src}`); const el = [...document.querySelectorAll("button")].find((b) => f(b)); el?.click(); return !!el; }, pred);
// Step 2: a room, no pets, weekly
console.log("room", await click(`b.textContent.trim() === "+" || b.querySelector("svg.lucide-plus")`)); await wait(200);
console.log("nopets", await click(`b.textContent.includes("No pets")`)); await wait(200);
console.log("weekly", await click(`b.textContent.trim().startsWith("Weekly")`)); await wait(200);
console.log("next", await click(`b.textContent.toUpperCase().includes("NEXT STEP")`)); await wait(900);
// Step 3: parking, access, supplies
console.log("parking", await click(`b.textContent.trim().toLowerCase() === "available on-site"`)); await wait(200);
console.log("access", await click(`b.textContent.trim().toLowerCase() === "i will be home"`)); await wait(200);
await p.evaluate(() => { const sel = [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "Customer")); if (sel) { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set; setter.call(sel, "Customer"); sel.dispatchEvent(new Event("change", { bubbles: true })); } });
await wait(300);
console.log("next", await click(`b.textContent.toUpperCase().includes("NEXT STEP")`)); await wait(1200);
console.log("on date step:", await p.evaluate(() => document.body.innerText.includes("Select Date & Time")));
const picked = await p.evaluate(() => { const btns = [...document.querySelectorAll(".grid.grid-cols-7 button:not([disabled])")]; const b = btns[3]; b?.click(); return b?.textContent.trim(); });
await wait(800);
const info = await p.evaluate(() => ({
  highlighted: [...document.querySelectorAll(".grid.grid-cols-7 button")].filter((b) => b.className.includes("ring-2")).map((b) => b.textContent.trim()),
  caption: [...document.querySelectorAll("p")].map((x) => x.innerText).find((t) => t.startsWith("First clean on")),
}));
console.log("picked", picked, JSON.stringify(info), "errors", JSON.stringify(errors));
await p.evaluate(() => document.querySelector(".grid.grid-cols-7")?.scrollIntoView({ block: "center" }));
await wait(500);
await p.screenshot({ path: `${out}/cal-weekly.png` });
await b.close();
