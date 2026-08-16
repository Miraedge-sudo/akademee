import { spawn } from "child_process";
import { existsSync } from "fs";

let chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
if (!existsSync(chromePath)) {
  chromePath = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
}

export async function launch({ url, headless = true, userDataDir }) {
  const args = [
    `--remote-debugging-port=9333`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-extensions",
    `--window-size=1440,900`,
  ];
  if (headless) args.push("--headless=new");
  args.push(url);

  const proc = spawn(chromePath, args, { stdio: "ignore" });

  let wsUrl = null;
  for (let i = 0; i < 60; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9333/json/list");
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {
      /* retry */
    }
  }
  if (!wsUrl) throw new Error("No devtools endpoint");
  return { proc, wsUrl };
}

export function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let msgId = 0;
  const listeners = new Set();

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  };

  const ready = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = (e) => reject(new Error("ws error"));
  });

  function send(method, params = {}) {
    return ready.then(() => {
      return new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    });
  }

  return {
    send,
    on: (fn) => listeners.add(fn),
    close: () => ws.close(),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };
