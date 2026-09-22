# Project media

**Status: 32 of 32 screenshots captured. 0 failures. 0 walkthrough videos recorded.**

Every project card and case study shows a **real screenshot of the live website**, captured with a headless Chrome on **22 Sep 2026**. No mockups, no stock imagery, no AI-generated pictures of websites.

Each capture's timestamp travels with it and is displayed in the UI, because these are stored images served from a CDN — not a live view of the site as it is right now.

---

## Capturing

```bash
npm run capture                          # anything without a screenshot yet
npm run capture -- --all                 # re-capture everything
npm run capture -- --only=midis,high-spirits
npm run capture -- --headed              # watch the browser work
```

Requires Chrome or Edge installed locally. `playwright-core` drives whichever it finds — **no browser is downloaded**, so `node_modules` stays small.

Output goes to `public/projects/<slug>/` plus a manifest at `src/data/screenshots.generated.json`. Commit both. The app reads the manifest for paths, timestamps and status; it is generated, so never edit it by hand.

### Why this runs locally rather than on a server

| Option | Verdict |
| --- | --- |
| **Local script, committed output** | **Chosen.** Zero runtime cost, zero attack surface, images served from the CDN like any other asset. |
| Vercel serverless function | Chromium doesn't fit a standard function without `@sparticuz/chromium`; cold-starting a browser to serve an image that changes twice a year is a poor trade. |
| Scheduled cron | Repeatedly loading 16 client websites for content that rarely changes. Wasteful and slightly rude. |
| Paid screenshot API | An API key, a bill, and a third-party dependency for something a local script does in ten minutes. |

**The security consequence is the point.** There is no capture endpoint, so there is no URL parameter, so SSRF is structurally impossible rather than merely defended against. The target list is the project data itself — an allowlist by construction. Nothing is admin-gated because there is nothing to gate.

### Optional: scheduled refresh

If you ever want it automated, the same script runs unchanged in a GitHub Action on `workflow_dispatch` plus a monthly `schedule`, with `npx playwright install --with-deps chromium` as a setup step (CI runners have no Chrome), committing any changed files. Monthly is the right order of magnitude. Do not run it daily.

---

## Capture settings

| | Desktop | Mobile |
| --- | --- | --- |
| Viewport | 1440 × 900 | 390 × 844 |
| Device scale | 2× | 2× |
| Output | 2880 × 1800 WebP | 780 × 1688 WebP |
| Quality | 82 (auto-drops to 68 if over 2 MB) | same |

Before each shutter the script waits for `networkidle` (raced against a 6 s cap, since analytics beacons keep some sites permanently "busy"), awaits `document.fonts.ready`, scrolls the full page height to trip lazy-load observers and returns to the top, waits on any still-loading images, then holds 2.5 s for entrance animations to land. `reducedMotion: "reduce"` is set so animated heroes are captured in a settled state. Failures retry twice with backoff.

### Consent banners

Overlays are **hidden, never accepted**. Clicking "Accept all" would record a consent decision on the site owner's behalf and, on some sites, fire the very tracking the banner exists to gate. Hiding the element in our own capture consents to nothing, sets no cookies and changes nothing on their site.

Detection is two-pass and deliberately conservative:
1. Known CMP selectors (OneTrust, Cookiebot, Osano, Termly, CookieYes, Complianz, Usercentrics, Didomi…), plus generic `cookie`/`consent` attribute matches — but **only** on elements that are `fixed`/`sticky` or a dialog. Plenty of sites have "cookie" in ordinary copy.
2. A text-based pass for hand-rolled banners with no identifying id or class, gated on being a fixed overlay of banner size, containing consent vocabulary, and having something clickable.

Overlays were hidden on 7 of 16 sites. Add per-project overrides to `EXTRA_HIDE` in the script if a new one slips through.

### Marketing interstitials

Newsletter and promo modals are **dismissed** rather than hidden — the script clicks the modal's own close control where one exists, which is exactly what the × is for and lets the site tear down its own backdrop. That is a deliberate contrast with consent banners, which are only ever hidden: closing a mailing-list popup carries no consent implications, accepting cookies does.

These popups are usually session-gated, so they appear on some runs and not others. Mining Discovery's caught one on the first pass and none on the next — which is precisely why the dismissal runs on every capture instead of being patched per site. **Always look at the output**; a statistical "not blank" check will happily pass a screenshot of a popup.

---

## Testing results — 22 Sep 2026

All 16 sites captured successfully on the first pass. Sizes are the stored WebP; the browser receives a much smaller responsive variant (≈14 kB at 640 px).

| Project | Desktop | Mobile | Status | Notes |
| --- | --- | --- | --- | --- |
| DigiPowerX | ✅ 124 kB | ✅ 58 kB | OK | Consent overlay hidden. Cannot be iframed (`X-Frame-Options: SAMEORIGIN`). |
| Laura Stein | ✅ 281 kB | ✅ 102 kB | OK | Heaviest capture — image-dense homepage. |
| Aureus Hospitality | ✅ 133 kB | ✅ 75 kB | OK | |
| HQB Pro Solutions | ✅ 96 kB | ✅ 46 kB | OK | Fastest site in the set (~5.5 s). |
| Mobile Tyre Camberley | ✅ 185 kB | ✅ 69 kB | OK | Consent overlay hidden. |
| Mobile Tyre UK | ✅ 277 kB | ✅ 83 kB | OK | |
| NeoCloudz | ✅ 142 kB | ✅ 39 kB | OK | Consent overlay hidden. |
| Solar Spectrum | ✅ 248 kB | ✅ 91 kB | OK | Consent overlay hidden. |
| Gulf Connect Consultancy | ✅ 175 kB | ✅ 65 kB | OK | Consent overlay hidden. |
| MIDIS | ✅ 63 kB | ✅ 37 kB | OK | Smallest capture. |
| Mining Discovery | ✅ 437 kB | ✅ 132 kB | OK | Newsletter modal dismissed; re-captured. Image-dense news homepage. |
| High Spirits | ✅ 117 kB | ✅ 49 kB | OK | Animated hero; `reducedMotion` settles it. |
| Noble Mining Conference | ✅ 131 kB | ✅ 57 kB | OK | |
| Mining Investment Event | ✅ 92 kB | ✅ 51 kB | OK | Slowest to settle (~16 s). |
| Mobile Tyre Champions | ✅ 273 kB | ✅ 84 kB | OK | Consent overlay hidden (custom, text-matched). |
| US Data Centers | ✅ 111 kB | ✅ 56 kB | OK | Consent overlay hidden. Slower to settle (~15 s). |

**URLs that could not be captured: none.**

Total on disk: **3.6 MB across 32 files.**

Every image was verified non-blank by per-channel standard deviation (all ≫ 12), and four were inspected by eye to confirm they show the real site rather than an error or consent wall.

---

## Additional pages

Only homepages are captured. The script's `VIEWPORTS` map and per-project target list are the place to add more — e.g. an agenda page for Noble, or the news section for Mobile Tyre Champions. Keep the set small; each page is another thing to re-capture when a client redesigns.

**Never capture** anything behind a login, an admin or CMS back end, or any page showing real customer data. The script has no credentials and cannot reach authenticated pages, and it should stay that way.

---

## Walkthrough videos

Optional, and none recorded. **No video button renders until a video exists**, so there are no empty players.

Add `walkthrough.mp4` and `poster.webp` to the project's folder, then add an entry to `VIDEOS` in `src/data/projectMedia.ts`:

```ts
const VIDEOS: Record<string, ProjectVideo> = {
  "high-spirits": {
    src: "/projects/high-spirits/walkthrough.mp4",
    poster: "/projects/high-spirits/poster.webp",
    title: "High Spirits — website walkthrough",
  },
};
```

### Encoding

H.264 MP4, 1920×1080, 30 fps, CRF ~24, target ≤ 8 MB. Strip audio unless narration adds something. Put `moov` at the front so playback can start before the file finishes:

```bash
ffmpeg -i raw.mov -vf scale=1920:-2 -r 30 -c:v libx264 -crf 24 -preset slow \
  -an -movflags +faststart walkthrough.mp4

ffmpeg -i walkthrough.mp4 -vframes 1 -q:v 2 poster.webp
```

### Recording plan

20–45 s for a quick preview, 45–90 s for a case study:

1. Homepage as it first paints — let the entrance animation play.
2. Scroll the main sections at a readable pace.
3. Cut to mobile, or resize.
4. Demonstrate the interaction that matters most — a filter, a form, a transition.
5. Open one relevant inner page.
6. Show what's distinctive about the build.
7. End on the brand or a call to action.

Record at 1920×1080 with a clean browser profile, bookmarks and extensions hidden. Move the cursor deliberately. **Never record** dashboards, logins, credentials, customer data or anything under NDA.

---

## Live preview vs screenshots

Case studies lead with a **live inline preview** — the real site in an iframe at true device dimensions — with the screenshot gallery beneath it. Framing permission per site was checked from `X-Frame-Options` and CSP `frame-ancestors` headers on 22 Sep 2026: 15 of 16 allow it, DigiPowerX does not and falls back to a panel plus its screenshot. Re-check after a client redeploys:

```bash
curl -sIL -A "Mozilla/5.0" https://example.com/ | grep -iE "x-frame-options|content-security-policy"
```

---

## Performance

- Screenshots render through `next/image`, which negotiates WebP/AVIF and serves a responsive variant — a 2880 px source is delivered as ~14 kB at card size.
- Cards show them **in full colour**. These are real captures of client sites, so their branding is the point; a desaturating filter would work against the content. Hover is handled by scale, border and the title underline instead.
- After re-capturing, clear `.next/cache/images` — Next caches optimised variants and will keep serving the old one otherwise.
- All card images lazy-load. None are marked `priority`: they sit below the fold, and preloading them would compete with the hero for LCP.
- No API request is made for screenshots at runtime — paths are baked into the page at build time.
- The live-preview iframe and any `<video>` mount only on demand.
