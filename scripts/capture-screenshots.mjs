/**
 * Captures real screenshots of the live project websites.
 *
 * ── Why this is a local script and not a server route ───────────────────────
 * Screenshots change when a client redesigns their site — a few times a year.
 * Paying for a headless browser at runtime to serve an image that stale is a
 * bad trade. So capture happens here, at authoring time, and the results are
 * committed as static assets that Vercel's CDN serves like any other image.
 *
 * The security consequence is the important part: there is no capture
 * endpoint, so there is no URL parameter, so SSRF is structurally impossible
 * rather than merely defended against. The target list is the project data
 * itself — an allowlist by construction.
 *
 * ── Usage ───────────────────────────────────────────────────────────────────
 *   npm run capture                  # every project missing a screenshot
 *   npm run capture -- --all         # re-capture everything
 *   npm run capture -- --only=midis,high-spirits
 *   npm run capture -- --headed      # watch it work, for debugging
 *
 * Requires Chrome or Edge installed locally; no browser is downloaded.
 * Writes results to public/projects/<slug>/ and a manifest at
 * src/data/screenshots.generated.json, which the app reads for `capturedAt`.
 */

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "projects");
const MANIFEST = join(ROOT, "src", "data", "screenshots.generated.json");

/* ── Capture targets ──────────────────────────────────────────────────────── */

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, scale: 2 },
  mobile: { width: 390, height: 844, isMobile: true, scale: 2 },
};

/** Hard ceilings so one pathological site can't stall or bloat the run. */
const LIMITS = {
  navigationMs: 45_000,
  settleMs: 2_500,
  networkIdleMs: 6_000,
  maxBytes: 2 * 1024 * 1024,
  retries: 2,
};

/**
 * Targets are read from the app's own project data so the two can't drift.
 * `projects.ts` is TypeScript, so rather than add a transpiler to a build
 * script, the small amount needed — slug and liveUrl — is parsed out of it.
 */
async function readTargets() {
  const source = await readFile(join(ROOT, "src", "data", "projects.ts"), "utf8");
  const targets = [];

  // Each project object opens with `id:` and carries `slug:` and `liveUrl:`.
  const blocks = source.split(/\n  \{\n/).slice(1);
  for (const block of blocks) {
    const slug = block.match(/slug:\s*"([^"]+)"/)?.[1];
    const title = block.match(/title:\s*"([^"]+)"/)?.[1];
    const liveUrl = block.match(/liveUrl:\s*"([^"]+)"/)?.[1];
    if (slug && liveUrl) targets.push({ slug, title: title ?? slug, liveUrl });
  }

  if (!targets.length) {
    throw new Error(
      "No capture targets found in src/data/projects.ts — has its shape changed?"
    );
  }
  return targets;
}

/* ── Consent banners ──────────────────────────────────────────────────────── */

/**
 * Consent overlays are *hidden*, never accepted.
 *
 * Clicking "Accept all" would record a consent decision on the site owner's
 * behalf and, on some sites, fire the very tracking the banner exists to
 * gate. Hiding the element in our own capture consents to nothing, sets no
 * cookies and changes nothing on their site — it just doesn't photograph the
 * overlay.
 *
 * Matching is deliberately conservative: an element must both match a
 * consent-ish selector AND be a fixed/sticky overlay or a dialog. Plenty of
 * sites have the word "cookie" in ordinary content, and a bare attribute
 * match would blank it.
 */
const CONSENT_SELECTORS = [
  // Named platforms first — these are exact and safe.
  "#onetrust-consent-sdk",
  "#onetrust-banner-sdk",
  "#CybotCookiebotDialog",
  "#CybotCookiebotDialogBodyUnderlay",
  ".osano-cm-window",
  "#termly-code-snippet-support",
  ".cky-consent-container",
  ".cky-overlay",
  ".cmplz-cookiebanner",
  "#cookie-law-info-bar",
  "#cookiescript_injected",
  "#usercentrics-root",
  "#didomi-host",
  "#hs-eu-cookie-confirmation",
  "#gdpr-cookie-message",
  ".cc-window",
  // Generic patterns, gated by the position check below.
  '[id*="cookie" i]',
  '[class*="cookie" i]',
  '[id*="consent" i]',
  '[class*="consent" i]',
  '[aria-label*="cookie" i]',
  '[aria-label*="consent" i]',
];

/** Per-project extras, for anything the generic pass misses. */
const EXTRA_HIDE = {
  // "slug": ["#some-specific-overlay"],
};

async function hideConsentBanners(page, slug) {
  return page
    .evaluate(
      ({ selectors, extra }) => {
        const hidden = [];

        for (const selector of [...selectors, ...extra]) {
          let nodes;
          try {
            nodes = document.querySelectorAll(selector);
          } catch {
            continue;
          }

          for (const el of nodes) {
            const style = getComputedStyle(el);
            const overlay =
              style.position === "fixed" || style.position === "sticky";
            const dialog =
              el.tagName === "DIALOG" ||
              el.getAttribute("role") === "dialog" ||
              el.getAttribute("role") === "alertdialog";

            // An ordinary in-flow element mentioning cookies is content.
            if (!overlay && !dialog) continue;

            el.style.setProperty("display", "none", "important");
            hidden.push(selector);
          }
        }

        // Second pass: hand-rolled banners.
        //
        // Plenty of sites build their own consent notice as a plain
        // Tailwind div with no identifying id or class — nothing to select
        // on but the words inside it. Guards, all of which must hold:
        // it's a fixed/sticky overlay, it's banner-sized, it actually says
        // "cookie"/"consent"/"gdpr", it has something to click, and it
        // isn't large enough to be the page itself.
        for (const el of document.querySelectorAll("body *")) {
          if (el.style.display === "none") continue;

          const style = getComputedStyle(el);
          if (style.position !== "fixed" && style.position !== "sticky") continue;

          const rect = el.getBoundingClientRect();
          if (rect.width < 150 || rect.height < 60) continue;
          if (rect.width * rect.height > innerWidth * innerHeight * 0.9) continue;

          const text = (el.innerText || "").replace(/\s+/g, " ").trim();
          if (text.length < 40 || text.length > 1200) continue;
          // "privacy" alone is too loose — a sticky footer privacy link
          // would match. Require the consent vocabulary.
          if (!/cookie|consent|gdpr/i.test(text)) continue;
          if (!el.querySelector("button, a, [role='button']")) continue;

          el.style.setProperty("display", "none", "important");
          hidden.push("text-matched consent banner");
        }

        // Consent platforms commonly lock scrolling while the banner is up.
        // Release it, or the lazy-load scroll pass can't run.
        for (const el of [document.documentElement, document.body]) {
          const style = getComputedStyle(el);
          if (style.overflow === "hidden") {
            el.style.setProperty("overflow", "visible", "important");
          }
          if (style.position === "fixed") {
            el.style.setProperty("position", "static", "important");
          }
        }

        return [...new Set(hidden)];
      },
      { selectors: CONSENT_SELECTORS, extra: EXTRA_HIDE[slug] ?? [] }
    )
    .catch(() => []);
}

/* ── Marketing interstitials ──────────────────────────────────────────────── */

/**
 * Newsletter and promo modals are *dismissed*, by clicking their own close
 * control where one exists.
 *
 * This is a different situation from a consent banner and is treated
 * differently on purpose. Closing a "join our mailing list" popup is ordinary
 * visitor behaviour with no consent implications — it is exactly what the ×
 * is for. Accepting cookies is not, which is why that path only ever hides.
 *
 * These popups are usually session-gated, so they appear on some runs and not
 * others. That intermittency is the reason this runs on every capture rather
 * than being patched per-site after the fact.
 */
const PROMO_TEXT =
  /subscribe|newsletter|sign\s?up|mailing list|join our|stay ahead|get the latest|don'?t miss/i;

const MODAL_SELECTORS = [
  '[role="dialog"]',
  '[aria-modal="true"]',
  '[class*="modal" i]',
  '[class*="popup" i]',
  '[class*="newsletter" i]',
  '[class*="subscribe" i]',
  "dialog[open]",
];

async function dismissInterstitials(page) {
  // Many modals close on Escape; cheapest thing to try first.
  await page.keyboard.press("Escape").catch(() => {});

  return page
    .evaluate(
      ({ selectors, pattern }) => {
        const promo = new RegExp(pattern, "i");
        const dismissed = [];

        for (const selector of selectors) {
          let nodes;
          try {
            nodes = document.querySelectorAll(selector);
          } catch {
            continue;
          }

          for (const el of nodes) {
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") continue;

            const rect = el.getBoundingClientRect();
            // Big enough to be an interstitial, not a dropdown or tooltip.
            if (rect.width < 240 || rect.height < 180) continue;

            const text = (el.innerText || "").replace(/\s+/g, " ").trim();
            if (!promo.test(text)) continue;

            const close = el.querySelector(
              '[aria-label*="close" i], [title*="close" i], [class*="close" i]'
            );

            if (close instanceof HTMLElement) {
              // Preferred: let the site tear down its own modal, which also
              // removes whatever backdrop it put up.
              close.click();
              dismissed.push("closed");
            } else {
              el.style.setProperty("display", "none", "important");
              dismissed.push("hidden");

              // No close control means the backdrop is ours to clear too.
              for (const node of document.querySelectorAll("body *")) {
                const s = getComputedStyle(node);
                if (s.position !== "fixed") continue;
                const r = node.getBoundingClientRect();
                const covers =
                  r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9;
                if (!covers) continue;
                if ((node.innerText || "").trim()) continue; // has content
                if (s.backdropFilter !== "none" || s.backgroundColor !== "rgba(0, 0, 0, 0)") {
                  node.style.setProperty("display", "none", "important");
                }
              }
            }
          }
        }

        return [...new Set(dismissed)];
      },
      { selectors: MODAL_SELECTORS, pattern: PROMO_TEXT.source }
    )
    .catch(() => []);
}

/* ── Capture ──────────────────────────────────────────────────────────────── */

const exists = (p) =>
  access(p).then(
    () => true,
    () => false
  );

/**
 * Settle the page before capturing.
 *
 * `networkidle` alone is unreliable — analytics beacons and polling keep some
 * sites permanently "busy" — so it is raced against a timeout. Then fonts are
 * awaited, lazy images are forced in by scrolling the full height, and a beat
 * is allowed for entrance animations to land on their final frame.
 */
async function settle(page, slug) {
  await page
    .waitForLoadState("networkidle", { timeout: LIMITS.networkIdleMs })
    .catch(() => {});

  await page.evaluate(() => document.fonts?.ready).catch(() => {});

  // Before the scroll pass: consent platforms lock scrolling.
  const hidden = await hideConsentBanners(page, slug);

  // Trip lazy-loading observers, then return to the top for the capture.
  await page
    .evaluate(async () => {
      const step = window.innerHeight;
      const total = document.body.scrollHeight;
      for (let y = 0; y < total; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 250));
    })
    .catch(() => {});

  // Let above-the-fold images that just started loading finish.
  await page
    .evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .slice(0, 30)
          .map(
            (img) =>
              new Promise((res) => {
                img.addEventListener("load", res, { once: true });
                img.addEventListener("error", res, { once: true });
                setTimeout(res, 3000);
              })
          )
      )
    )
    .catch(() => {});

  // Some platforms re-inject the banner after their own async init, so run
  // the pass once more immediately before the shutter. Promo modals are
  // usually on a timer, so they get dismissed at the same late point.
  await hideConsentBanners(page, slug);
  await dismissInterstitials(page);

  await page.waitForTimeout(LIMITS.settleMs);

  // One last sweep: a modal can fire during that final settle.
  await dismissInterstitials(page);
  await page.waitForTimeout(400);

  return hidden;
}

async function captureOne(browser, target, device) {
  const vp = VIEWPORTS[device];

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.scale,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    // Some sites serve a stripped page to unknown agents; present as a normal
    // browser rather than pretending to be something we are not.
    userAgent: vp.isMobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
    // Expired/self-signed certificates shouldn't abort a visual capture, and
    // nothing here reads or submits data.
    ignoreHTTPSErrors: true,
    locale: "en-GB",
    reducedMotion: "reduce",
  });
  context.setDefaultTimeout(LIMITS.navigationMs);

  const page = await context.newPage();

  try {
    const response = await page.goto(target.liveUrl, {
      waitUntil: "domcontentloaded",
      timeout: LIMITS.navigationMs,
    });

    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(`HTTP ${status}`);
    }

    const hiddenBanners = await settle(page, target.slug);

    const png = await page.screenshot({ type: "png", fullPage: false });

    const webp = await sharp(png)
      .resize({ width: vp.width * 2, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();

    if (webp.byteLength > LIMITS.maxBytes) {
      // Second pass at lower quality rather than shipping a 2 MB image.
      const smaller = await sharp(png)
        .resize({ width: vp.width * 2, withoutEnlargement: true })
        .webp({ quality: 68, effort: 6 })
        .toBuffer();
      return { buffer: smaller, status, finalUrl: page.url(), hiddenBanners };
    }

    return { buffer: webp, status, finalUrl: page.url(), hiddenBanners };
  } finally {
    await context.close();
  }
}

async function captureWithRetry(browser, target, device) {
  let lastError;
  for (let attempt = 1; attempt <= LIMITS.retries + 1; attempt++) {
    try {
      return await captureOne(browser, target, device);
    } catch (error) {
      lastError = error;
      if (attempt <= LIMITS.retries) {
        process.stdout.write(` retry${attempt}`);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw lastError;
}

/* ── Runner ───────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

async function main() {
  const all = await readTargets();
  const only = value("only")?.split(",").map((s) => s.trim());
  const targets = only ? all.filter((t) => only.includes(t.slug)) : all;

  if (!targets.length) {
    console.error(`No targets matched --only=${value("only")}`);
    process.exit(1);
  }

  let browser;
  for (const channel of ["chrome", "msedge"]) {
    try {
      browser = await chromium.launch({ channel, headless: !flag("headed") });
      console.log(`Browser: ${channel} ${browser.version()}\n`);
      break;
    } catch {
      /* try the next channel */
    }
  }
  if (!browser) {
    console.error(
      "Could not launch Chrome or Edge.\n" +
        "Install one of them, or run: npx playwright install chromium"
    );
    process.exit(1);
  }

  const manifest = (await exists(MANIFEST))
    ? JSON.parse(await readFile(MANIFEST, "utf8"))
    : {};

  const results = [];

  try {
    for (const target of targets) {
      await mkdir(join(OUT_DIR, target.slug), { recursive: true });

      for (const device of Object.keys(VIEWPORTS)) {
        const file = `${device}-home.webp`;
        const abs = join(OUT_DIR, target.slug, file);
        const key = `${target.slug}/${device}-home`;

        if (!flag("all") && (await exists(abs))) {
          console.log(`  · ${key} — exists, skipping`);
          results.push({ ...target, device, status: "skipped" });
          continue;
        }

        process.stdout.write(`  → ${key}`);
        const started = Date.now();

        try {
          const { buffer, status, finalUrl, hiddenBanners } = await captureWithRetry(
            browser,
            target,
            device
          );
          await writeFile(abs, buffer);

          const kb = (buffer.byteLength / 1024).toFixed(0);
          const secs = ((Date.now() - started) / 1000).toFixed(1);
          console.log(`  ✓ ${kb} kB in ${secs}s`);

          manifest[key] = {
            src: `/projects/${target.slug}/${file}`,
            device,
            page: "home",
            status: "ready",
            capturedAt: new Date().toISOString(),
            sourceUrl: finalUrl,
            httpStatus: status,
            bytes: buffer.byteLength,
            consentOverlayHidden: (hiddenBanners ?? []).length > 0,
          };
          results.push({ ...target, device, status: "ready", kb });
        } catch (error) {
          const message = String(error?.message ?? error)
            .split("\n")[0]
            .slice(0, 160);
          console.log(`  ✗ ${message}`);

          manifest[key] = {
            src: `/projects/${target.slug}/${file}`,
            device,
            page: "home",
            status: "failed",
            attemptedAt: new Date().toISOString(),
            error: message,
          };
          results.push({ ...target, device, status: "failed", error: message });
        }
      }
    }
  } finally {
    await browser.close();
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  /* ── Report ── */
  const ready = results.filter((r) => r.status === "ready").length;
  const failed = results.filter((r) => r.status === "failed");
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log(
    `\n${ready} captured, ${failed.length} failed, ${skipped} skipped.`
  );

  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) {
      console.log(`  ${f.slug} (${f.device}) — ${f.error}`);
    }
  }

  console.log(`\nManifest: ${MANIFEST.replace(ROOT, ".")}`);
  // Non-zero exit on failure so CI can't report a green run that captured
  // nothing.
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
