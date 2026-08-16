import { launch, connect, sleep } from "./cdp.mjs";
import { writeFileSync, mkdirSync } from "fs";

const loginRes = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subdomain: "perf1", email: "admin@perf1.cm", password: "Akademee@2025" }),
});
const token = (await loginRes.json()).data.token;

const { proc, wsUrl } = await launch({ url: "http://localhost:3000", headless: true, userDataDir: "C:/tmp/akademee-modalsave" });
const cdp = connect(wsUrl);
const send = cdp.send;
await send("Page.enable");
await send("Runtime.enable");

const errors = [];
const bad = [];
cdp.on((msg) => {
  if (msg.method === "Runtime.exceptionThrown") {
    errors.push((msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "").slice(0, 200));
  }
  if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
    bad.push(`HTTP ${msg.params.response.status} ${msg.params.response.url}`);
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
    if (!btns.length) return 'no btn';
    btns[0].click();
    return 'opened';
  })()`,
});
await sleep(1200);

// Cliquer Enregistrer (le preset francophone est préchargé)
await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => /^Save$|^Enregistrer$/.test(b.innerText.trim()));
    if (!btns.length) return 'no save';
    btns[0].click();
    return 'saved';
  })()`,
});
console.log("save cliqué, attente création...");
await sleep(8000);

// Vérifier la grille
const t = await send("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true });
const txt = t.result.value;
console.log("grille Période 1:", /Période 1/.test(txt));
console.log("grille Période 6:", /Période 6/.test(txt));
console.log("récréation:", /Récréation|Break/.test(txt));
console.log("compteurs:", (txt.match(/\d+\/\d+/g) || []).slice(0, 4));
console.log("total slots:", (txt.match(/\d+(?= total)/) || ["?"])[0]);
console.log("erreurs React:", errors.length ? errors.slice(0, 3) : "aucune");
console.log("réponses 4xx:", bad.length ? bad.slice(0, 3) : "aucune");
const shot = await send("Page.captureScreenshot", { format: "png" });
mkdirSync("out", { recursive: true });
writeFileSync("out/modal-save.png", Buffer.from(shot.data, "base64"));
proc.kill();
process.exit(0);
