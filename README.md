# Swayam Gandhi — Portfolio

An interactive portfolio for a full stack developer, built on Next.js 16, TypeScript, Tailwind CSS v4, GSAP and a small amount of WebGL.

Design concept: **The Workbench** — a digital developer studio. Deep ink surfaces with a blueprint grid, one warm paper inversion, a single signal accent, and monospace used as technical annotation throughout. Editorial typography with serif italic emphasis inside otherwise-grotesk headlines.

---

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run typecheck` | `tsc --noEmit` (run `next build` once first so Next's generated route types exist) |
| `npm run capture` | Screenshot every project's live site (needs local Chrome/Edge) — see [MEDIA.md](MEDIA.md) |

---

## Where the content lives

All copy is data. Nothing that renders as fact is hard-coded in a component.

| File | Contents |
| --- | --- |
| `src/data/site.ts` | Name, role, headline, contact details, social links, nav |
| `src/data/projects.ts` | Categories + all 16 projects — drives the filter grid, `/work/[slug]`, and the sitemap |
| `src/data/projectMedia.ts` | Screenshots, walkthrough videos, iframe-embedding status ([MEDIA.md](MEDIA.md)) |
| `src/data/stack.ts` | Technology groups |
| `src/data/journey.ts` | Timeline chapters |
| `src/data/services.ts` | Services |

### Adding or changing a project

Append an object to `projects` in `src/data/projects.ts` with a `liveUrl`. The filter grid, the category chips and their counts, the case-study route, the prev/next navigation and the sitemap all follow automatically. Then run `npm run capture` — it reads its targets from that same file, so there is no second list to keep in sync.

`featured: true` is a **manual** selection — it sorts a project to the front of the grid and gives it a "Featured" marker. It is not a ranking and nothing computes it.

### Placeholders

Unverified values are wrapped in `placeholder("…")`. They render with a dotted underline and a small **edit** chip; placeholder URLs render as inert text rather than dead links; and a case study with no confirmed contribution shows an explicit "awaiting its write-up" notice instead of an empty section. Those pages are also set to `noindex` and kept out of the sitemap until they have real content.

**Currently placeholders:**

- **LinkedIn URL** — needs the public `linkedin.com/in/…` profile URL.
- **Location** and **résumé URL**.
- **Contribution and technologies for 10 projects** — DigiPowerX, NeoCloudz, US Data Centers, Laura Stein, Aureus Hospitality, HQB Pro Solutions, Solar Spectrum, Gulf Connect Consultancy, Mobile Tyre Camberley, Mobile Tyre UK. Their *descriptions* were written from the live sites and are real; only the record of who built what is missing.
- **Laura Stein's description** — the live site publishes mining news as "Laura's Liaisons", which doesn't match the "personal brand website" framing. Needs a decision.
- All **repository links** (none provided).
- **Employer name** on every timeline entry, and the periods for chapters 02–04.

### Cover images

A project's cover is its captured desktop screenshot — no separate asset to maintain. Set `image` on the project to override it with a specific file.

---

## Architecture notes

**Routing.** One scrolling page (`/`) with seven anchored sections, plus a statically generated case study per project at `/work/[slug]`. All 16 project pages are prerendered at build time.

**Filtering.** Every card stays mounted and filtering toggles a `hidden` class. That keeps all 16 projects in the server HTML for crawlers, and gives GSAP Flip the same DOM nodes before and after so it can animate the re-layout — unmounting would leave Flip nothing to match against. The Flip state is captured in the change handler, before React re-renders, and replayed in a layout effect after commit but before paint.

The filter bar is a radio group, not a row of buttons: one option is active at a time, which is what a radio group means, and it brings arrow-key navigation and a roving tab stop with it.

**Motion — one library, not two.** GSAP (with ScrollTrigger and SplitText) handles everything scripted: reveals, parallax, the timeline spine, the page-transition panel, the magnetic buttons, the cursor. Framer Motion was in the build for exactly one thing — the mobile menu's enter/exit — and cost 40 kB gzipped for it, so it was replaced with a CSS `clip-path` transition and `inert`. Anything that can be a CSS transition is one; GSAP is reserved for what genuinely needs a timeline or a scroll trigger.

**Smooth scroll.** Lenis is driven from GSAP's ticker so scroll position and ScrollTrigger measurements update on the same frame. It is disabled entirely under `prefers-reduced-motion`.

**Reveals render visible.** Scroll animations apply their hidden state in a layout effect, before paint — so content is in the server HTML for crawlers and for anyone without JavaScript, and never hidden if a script fails.

**The intro.** Server-rendered, then removed before first paint by a blocking script in `layout.tsx` that checks `sessionStorage` and the reduced-motion preference. Deciding in an effect would flash the intro at returning visitors; deciding during render would break hydration. As a result `Preloader` holds no state at all.

**Page transitions** are reveal-only — the panel covers the new route on its first painted frame and wipes away. Holding a route open to play an exit animation means intercepting navigation, which breaks the back button.

**WebGL.** One `THREE.Points` plane displaced entirely in a vertex shader (~40 lines of GLSL, no models, no textures). It is lazily imported so three.js is absent from the initial bundle, mounted on `requestIdleCallback`, suspended via `frameloop="never"` when offscreen or backgrounded, capped at DPR 1.75, and skipped altogether for reduced motion, missing WebGL, or low-end devices — all of which fall back to a CSS dot-field that holds the same composition.

---

## Project media

**The case-study page shows the real website running, inline.** Not a screenshot of it — the live site, in a browser-chrome frame, interactive, with desktop / tablet / mobile width toggles, a reload button and a fullscreen view.

The iframe is rendered at **true device dimensions** (1440×900, 834×1112, 414×896) and CSS-scaled to fit the column. That distinction matters: an iframe sized to the column's width would trip the site's own responsive breakpoints and show a narrow layout labelled "desktop". Scaling shows the real thing.

**Framing permission** is recorded per project, verified on 2026-09-22 from live `X-Frame-Options` and CSP `frame-ancestors` headers. 15 of 16 allow it; **DigiPowerX sends `X-Frame-Options: SAMEORIGIN`** and gets a plain panel with an "Open live website" button instead. Nothing tries to defeat a site's framing policy. Because headers change and some sites bust frames from JavaScript, a 12-second runtime watchdog falls back the same way.

**Real screenshots, captured from the live sites.** Every card and case study shows an actual screenshot of the client's website — `npm run capture` drives a headless Chrome over each project's `liveUrl` at 1440×900 and 390×844, waits for fonts, lazy images and animations to settle, and writes 2× WebP to `public/projects/<slug>/`. 32 of 32 captured, zero failures. Each capture's timestamp is stored and shown in the UI, because these are stored images, not a live view.

Capture runs **locally, not on a server**. No endpoint means no URL parameter, which means SSRF is structurally impossible rather than merely defended against — the target list is the project data itself, an allowlist by construction. Full details, settings and the per-site results table are in **[MEDIA.md](MEDIA.md)**.

**Walkthrough videos** are optional and none are recorded; the button renders only when a video exists.

**Videos** are optional, and the button renders only when one exists — no empty players, no disabled controls.

**Cost control.** On the project grid, the iframe and `<video>` mount only while their modal is open — scrolling 16 cards loads zero external sites and zero video bytes. On a case-study page the inline preview mounts on an IntersectionObserver, so the external site is fetched only if the visitor scrolls to it. Videos use `preload="metadata"`. Nothing autoplays.

**Modals** are built on the native `<dialog>` element with `showModal()`, which gives correct focus trapping, page inertness, Escape-to-close and top-layer rendering without re-implementing any of it. Lenis and body scroll are locked manually, and focus is explicitly restored to the trigger on close.

---

## Measured payload

Homepage, production build, served with gzip and measured over the wire:

| | gzipped |
| --- | --- |
| HTML | 22 kB |
| CSS | 10 kB |
| **Initial JS** | **270 kB** |

Of that JS, ~151 kB is the React 19 + Next 16 framework baseline and ~67 kB is GSAP with ScrollTrigger, SplitText and Flip; the rest is Lenis plus application code. For reference: dropping Framer Motion took it from 293 kB to 253 kB, Flip and the filter system brought it to 266 kB, and the whole media system added 4 kB on top.

The homepage serves **zero iframes and zero `<video>` elements** — verified in the rendered HTML — and preloads no external origins.

`three.js` and `@react-three/fiber` are **not** in that number — verified absent from every chunk the initial HTML references. They load only after `requestIdleCallback` fires, and only on devices that pass the capability check.

Not yet measured: Lighthouse and field Core Web Vitals. Run those against a deployed URL before making any claim about scores — a local build on a fast machine will not tell you what a visitor gets.

---

## Contact

Email and phone are real and live in `src/data/site.ts`. The phone number is stored twice on purpose: `phone` is E.164 for the `tel:` href, `phoneDisplay` is the grouped form that gets rendered. Both have copy-to-clipboard buttons that report failure rather than showing a tick for a clipboard write that was blocked.

Neither appears anywhere except the contact section — not in the footer, not in metadata.

### The form

The form is complete — validation, `aria-describedby` error wiring, focus management, loading state, a live region, honeypot, a minimum time-to-complete, and per-IP rate limiting.

**Delivery goes through Resend.** The flow is: form → `POST /api/contact` → server-side route handler → Resend → inbox. The API key is read from `process.env.RESEND_API_KEY` inside the handler only; the SDK is dynamically imported there, so nothing about Resend can reach a client bundle.

```bash
cp .env.example .env.local   # then fill in the three variables
```

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | From Resend → API Keys. Server-only — never `NEXT_PUBLIC_`. |
| `CONTACT_TO_EMAIL` | Your inbox. Any address. |
| `CONTACT_FROM_EMAIL` | **Must be on a domain verified in Resend.** The visitor's address goes in `replyTo`, never `from` — using it as the sender would fail SPF/DKIM. |

With any of the three missing, the route returns 503 and the form says the message wasn't sent, rather than showing a false success.

The order of checks is deliberate — body size, spam screening, rate limit, validation, then the send — so the paid API call is the last thing that happens. Every value interpolated into the email is HTML-escaped: the message is arbitrary text from a stranger landing in your inbox.

Resend's own errors (which can name the account, domain or key) are logged server-side; the visitor only ever sees a generic failure message.

Before going live, consider a real CAPTCHA (Cloudflare Turnstile or hCaptcha) in front of the endpoint. The honeypot and timing checks stop naive bots, not targeted ones, and the rate limiter is in-memory and per-instance — on Vercel that means per warm lambda, not a global counter.

---

## Accessibility

Semantic landmarks and a single `h1`; skip link; visible focus rings on a dedicated accent; labelled form controls with errors wired to their inputs; alt text on every image; `aria-current` on the active nav item; Escape closes the mobile menu.

`prefers-reduced-motion` is honoured in three layers: a global CSS rule, a `useReducedMotion()` hook that gates every JS-driven animation, and a server-side default of "reduced" so a motion-sensitive visitor never sees a frame of animation before hydration corrects it. Under reduced motion, Lenis, the custom cursor, the intro and the WebGL field do not run at all.

Text colours were checked against WCAG AA: body muted text is 6.2:1 on ink, 5.0:1 on paper, and the accent is redefined inside `.on-paper` because `#ff5c35` only reaches 2.6:1 on a light background.

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — the framework is detected and no build settings need changing.
3. Set environment variables (see `.env.example`). `NEXT_PUBLIC_SITE_URL` matters: it is the base for canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt`.
4. Deploy.

`/api/contact` runs on the Node runtime; everything else is static or prerendered.
