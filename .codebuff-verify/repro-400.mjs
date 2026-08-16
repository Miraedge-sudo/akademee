import { launch, connect, sleep } from "./cdp.mjs";
import { writeFileSync, mkdirSync } from "fs";

const loginRes = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subdomain: "perf1", email: "admin@perf1.cm", password: "Akademee@2025" }),
});
const token = (await loginRes.json()).data.token;

const { proc, wsUrl } = await launch({ url: "http://localhost:3000", headless: true, userDataDir: "C:/tmp/akademee-repro400" });
const cdp = connect(wsUrl);
const send = cdp.send;
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");

// Capturer les erreurs console + les réponses 4xx avec leur body
const errors = [];
const badResponses = [];
cdp.on((msg) => {
  if (msg.method === "Runtime.consoleAPICalled") {
    const txt = (msg.params.args || []).map((a) => a.value || a.description || "").join(" ").slice(0, 250);
    if (/error|fail|depth/i.test(txt)) errors.push("CONSOLE: " + txt);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const txt = msg.params.exceptionDetails?.text || "";
    const desc = msg.params.exceptionDetails?.exception?.description || "";
    errors.push("EXC: " + (txt + " " + desc).slice(0, 300));
  }
  if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
    badResponses.push(`HTTP ${msg.params.response.status} ${msg.params.response.url}`);
  }
});

await sleep(1500);
await send("Runtime.evaluate", { expression: `localStorage.setItem('token','${token}'); location.href='/dashboard/timetable';` });
for (let i = 0; i < 30; i++) {
  const r = await send("Runtime.evaluate", { expression: "document.body.innerText.includes('Timetable')", returnByValue: true });
  if (r.result.value) break;
  await sleep(500);
}
await sleep(5000);

// Ouvrir le modal Périodes
await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => /^Periods$|^Créneaux$/.test(b.innerText.trim()));
    if (!btns.length) return 'no period btn';
    btns[0].click();
    return 'opened';
  })()`,
  returnByValue: true,
});
await sleep(1500);

// Cliquer "Enregistrer" (save) dans le modal
const saveRes = await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => /^Save$|^Enregistrer$/.test(b.innerText.trim()));
    if (!btns.length) return 'no save btn';
    btns[0].click();
    return 'clicked save';
  })()`,
  returnByValue: true,
});
console.log("save:", saveRes.result.value);
await sleep(6000);

console.log("=== ERREURS ===");
console.log(errors.slice(-15).join("\n") || "aucune");
console.log("=== RÉPONSES 4xx/5xx ===");
console.log(badResponses.slice(-8).join("\n") || "aucune");

// Toasts
const t = await send("Runtime.evaluate", { expression: "document.body.innerText.slice(-500)", returnByValue: true });
console.log("=== fin de page ===");
console.log(t.result.value.replace(/\n+/g, " | ").slice(-350));
proc.kill();
process.exit(0);
