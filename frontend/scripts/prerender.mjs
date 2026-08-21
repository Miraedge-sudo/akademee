/**
 * Post-build prerender step for the public marketing routes.
 *
 * The app is a client-rendered SPA (dist/index.html ships an empty
 * <div id="root">) — fine for Google, which executes JS, but bots that don't
 * (WhatsApp/Facebook/LinkedIn link previews, some search crawlers) see
 * nothing. This script boots the *already-built* dist/ bundle in a real
 * headless Chromium (via puppeteer, so every browser-only API the app uses —
 * localStorage, IndexedDB, matchMedia — works exactly as it does for a real
 * visitor), waits for react-helmet-async to inject that route's title/meta/
 * JSON-LD, and writes the fully-rendered HTML back to dist/ as a static
 * snapshot for that route.
 *
 * All routes are captured into memory first and written to disk only after
 * every capture finishes. Writing straight into dist/ mid-loop would corrupt
 * the run: dist/index.html doubles as the SPA fallback the preview server
 * serves for any route that doesn't have its own prerendered file yet, so
 * overwriting it with "/"'s baked-in title/meta before later routes are
 * captured makes THEIR fallback shell arrive pre-polluted with "/"'s tags —
 * which Helmet then can't dedupe against, since they're plain static markup
 * with no data-rh marker for it to recognize as its own.
 *
 * This is prerendering, not SSR/hydration: the client entry (src/main.jsx)
 * still does a plain `createRoot().render()`, so a real visitor's browser
 * replaces this snapshot with a fresh client render on load. Crawlers and
 * link-preview bots that only read the initial HTML get the real content
 * either way.
 */
import { preview } from "vite";
import puppeteer from "puppeteer";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

const ROUTES = [
  { path: "/", out: "index.html" },
  { path: "/login", out: "login/index.html" },
  { path: "/register", out: "register/index.html" },
];

async function main() {
  const server = await preview({
    root: rootDir,
    preview: { port: 4174, strictPort: true, host: "127.0.0.1" },
  });
  const baseUrl = server.resolvedUrls?.local?.[0] ?? "http://127.0.0.1:4174/";

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const captured = [];
  let failures = 0;

  try {
    for (const route of ROUTES) {
      // A fresh incognito-style context per route so no cookies/storage/SW
      // registration can carry over between captures.
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        await page.goto(new URL(route.path, baseUrl).href, {
          waitUntil: "load",
          timeout: 30000,
        });

        // React has mounted and react-helmet-async has committed this
        // route's <Seo> once document.title is non-empty.
        await page.waitForFunction(() => Boolean(document.title), {
          timeout: 15000,
        });

        // Guard against stale/duplicated head tags shipping silently.
        const titleCount = await page.evaluate(
          () => document.querySelectorAll("title").length,
        );
        if (titleCount !== 1) {
          throw new Error(
            `expected exactly 1 <title> tag, found ${titleCount} — likely stale state leaking across routes`,
          );
        }

        const html = await page.content();
        captured.push({ route, html });
        console.log(`  captured ${route.path}`);
      } catch (err) {
        failures += 1;
        console.error(`  FAILED to capture ${route.path}:`, err.message);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  }

  // Only touch disk once every route has been captured from the still-
  // pristine dist/ the preview server served throughout the whole pass.
  for (const { route, html } of captured) {
    const outPath = join(distDir, route.out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, "utf-8");
    console.log(`  wrote ${route.path} -> dist/${route.out}`);
  }

  if (failures > 0) {
    console.error(`Prerender finished with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("Prerender complete.");
}

main().catch((err) => {
  console.error("Prerender script crashed:", err);
  process.exit(1);
});
