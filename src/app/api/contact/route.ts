import { NextResponse } from "next/server";

/**
 * Contact endpoint — delivers form submissions by email through Resend.
 *
 * The API key lives only in `process.env.RESEND_API_KEY`, read here on the
 * server. Nothing about Resend is importable from the client: the SDK is
 * dynamically imported inside the handler, so it never enters a browser
 * bundle even by accident.
 *
 * Requires three environment variables — RESEND_API_KEY, CONTACT_TO_EMAIL
 * and CONTACT_FROM_EMAIL. With any of them missing the route returns 503 and
 * says so plainly, rather than showing a success state for a message nobody
 * received. `CONTACT_FROM_EMAIL` must be on a domain verified in Resend.
 *
 * Order of checks is deliberate: cheap rejections first, the paid API call
 * last. Body size, then spam screening, then rate limit, then validation,
 * then send.
 *
 * Remaining limits, worth knowing:
 *  • The rate limiter is in-memory and per-instance. On Vercel that means
 *    per warm lambda, so it throttles a single attacker but isn't a global
 *    counter. Upstash Redis is the usual upgrade if this ever matters.
 *  • The honeypot and timing checks stop naive bots, not targeted ones. A
 *    real CAPTCHA (Turnstile, hCaptcha) is the next step if spam appears.
 */

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  /** Optional. Blank is valid; anything present must look dialable. */
  phone?: string;
  message?: string;
  subject?: string;
  /** Honeypot. Deliberately meaningless name so autofill leaves it alone. */
  hpReference?: string;
  elapsed?: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Permissive on punctuation, strict on digit count — see the form for why. */
const PHONE_ALLOWED_RE = /^[+\d\s().-]+$/;

/** Optional field: empty passes. Mirrors `validatePhone` on the client. */
function phoneIsValid(phone: string): boolean {
  if (!phone) return true;
  if (phone.length > 32 || !PHONE_ALLOWED_RE.test(phone)) return false;
  const digits = phone.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

/** Bots submit the instant the DOM is ready; humans do not. */
const MIN_FILL_MS = 3_000;
const MAX_MESSAGE_LEN = 5_000;
/** Comfortably above a legitimate submission, far below anything abusive. */
const MAX_BODY_BYTES = 16 * 1024;

const RATE_LIMIT = { windowMs: 60_000 * 10, max: 5 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT.windowMs
  );
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT.max;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  // Checked before parsing: the length caps further down only help once the
  // body is already in memory, which is too late for a deliberately huge one.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "That message is a little too long." },
      { status: 413 }
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { message: "Malformed request." },
      { status: 400 }
    );
  }

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const phone = (payload.phone ?? "").replace(/[\r\n]+/g, " ").trim();
  const message = (payload.message ?? "").trim();
  // Newlines stripped before this reaches an email subject line. Resend takes
  // JSON so header injection isn't the risk it would be with raw SMTP, but a
  // subject is a single line by definition and shouldn't carry breaks.
  const subject = (payload.subject ?? "Project enquiry")
    .replace(/[\r\n]+/g, " ")
    .trim();

  // --- spam screening -----------------------------------------------------
  // Both checks return 200 with a neutral message: telling a bot exactly
  // which signal caught it just helps it try again.
  // Logged rather than dropped silently: if either check ever misfires on a
  // real visitor, the evidence is in the server logs instead of nowhere.
  if (payload.hpReference) {
    console.warn("[contact] honeypot triggered — dropping submission");
    return NextResponse.json({ message: "Thanks — message received." });
  }
  if (typeof payload.elapsed === "number" && payload.elapsed < MIN_FILL_MS) {
    console.warn(
      `[contact] submitted in ${payload.elapsed}ms — dropping submission`
    );
    return NextResponse.json({ message: "Thanks — message received." });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { message: "Too many messages from this address. Try again later." },
      { status: 429 }
    );
  }

  // --- validation (never trust the client's own check) --------------------
  if (
    name.length < 2 ||
    !EMAIL_RE.test(email) ||
    !phoneIsValid(phone) ||
    message.length < 20
  ) {
    return NextResponse.json(
      { message: "Please check the form and try again." },
      { status: 422 }
    );
  }
  if (subject.length > 120) {
    return NextResponse.json(
      { message: "Please check the form and try again." },
      { status: 422 }
    );
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { message: "That message is a little too long." },
      { status: 422 }
    );
  }

  // --- delivery -----------------------------------------------------------
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  // Still honest when unconfigured: no success state for a message that was
  // never sent. This is what a deploy missing its env vars will return.
  if (!apiKey || !to || !from) {
    console.error(
      "[contact] not configured — missing:",
      [
        !apiKey && "RESEND_API_KEY",
        !to && "CONTACT_TO_EMAIL",
        !from && "CONTACT_FROM_EMAIL",
      ]
        .filter(Boolean)
        .join(", ")
    );
    return NextResponse.json(
      {
        message:
          "This form isn't connected to an email service yet, so your message wasn't sent. Please email me directly in the meantime.",
      },
      { status: 503 }
    );
  }

  // Imported here rather than at module scope so the SDK is only pulled in
  // when a send actually happens, and never on a misconfigured deploy.
  const { Resend } = await import("resend");
  const { renderContactEmail } = await import("@/lib/contact-email");

  const email_ = renderContactEmail({
    name,
    email,
    phone,
    subject,
    message,
    submittedAt: new Date(),
  });

  try {
    const { data, error } = await new Resend(apiKey).emails.send({
      // Must be an address on a domain verified in Resend — a visitor's own
      // address here would fail SPF/DKIM and be rejected or junked.
      from,
      to,
      // So hitting reply in the inbox answers the visitor, not yourself.
      replyTo: email,
      subject: email_.subject,
      html: email_.html,
      text: email_.text,
    });

    if (error) {
      // Resend's message can name the account, domain or key — useful in the
      // server log, not something to hand to whoever is submitting the form.
      console.error("[contact] resend rejected the send:", error);
      return NextResponse.json(
        { message: "Couldn't send that message. Please email me directly." },
        { status: 502 }
      );
    }

    console.info(`[contact] sent ${data?.id ?? "(no id)"} for ${email}`);
  } catch (cause) {
    // Network failure, DNS, timeout — the SDK throws rather than returning.
    console.error("[contact] send threw:", cause);
    return NextResponse.json(
      { message: "Couldn't send that message. Please email me directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: "Message sent. I'll come back to you soon.",
  });
}
