import { launch, connect, sleep } from "./cdp.mjs";

const loginRes = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subdomain: "perf1", email: "admin@perf1.cm", password: "Akademee@2025" }),
});
const token = (await loginRes.json()).data.token;

const { proc, wsUrl } = await launch({ url: "http://localhost:3000", headless: true, userDataDir: "C:/tmp/akademee-final" });
const cdp = connect(wsUrl);
const send = cdp.send;
await send("Page.enable");
await send("Runtime.enable");

const exceptions = [];
cdp.on((msg) => {
  if (msg.method === "Runtime.exceptionThrown") {
    exceptions.push((msg.params.exceptionDetails?.exception?.description || "").slice(0, 150));
  }
});

await sleep(1500);
await send("Runtime.evaluate", { expression: `localStorage.setItem('token','${token}'); location.href='/dashboard/timetable';` });
for (let i = 0; i < 30; i++) {
  const r = await send("Runtime.evaluate", { expression: "document.body.innerText.includes('Timetable')", returnByValue: true });
  if (r.result.value) break;
  await sleep(500);
}

// Attendre 15s en surveillant les exceptions React (boucle infinie)
let loop = false;
for (let i = 0; i < 15; i++) {
  await sleep(1000);
  if (exceptions.some((e) => /Maximum update depth|too many re-renders/i.test(e))) {
    loop = true;
    break;
  }
}
console.log("BOUCLE INFINIE (Maximum update depth):", loop ? "OUI ❌" : "non ✓");
console.log("exceptions:", exceptions.length ? exceptions.slice(0, 3) : "aucune");

// État de la page après 15s stable
const t = await send("Runtime.evaluate", { expression: "document.body.innerText.slice(0, 300)", returnByValue: true });
console.log("page stable:", t.result.value.replace(/\n+/g, " | ").slice(0, 150));
proc.kill();
process.exit(0);
