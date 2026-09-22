import { NextResponse } from "next/server";

/**
 * Contact endpoint.
 *
 * DELIBERATELY NOT SENDING EMAIL YET.
 *
 * Everything around delivery is built — validation, spam screening, rate
 * limiting, error shapes — but the send itself is gated behind environment
 * variables that have not been configured. Until they are, this returns a
 * clear 503 and the form tells the visitor the truth rather than showing a
 * success state for a message nobody received.
 *
 * To switch delivery on:
 *   1. npm install resend
 *   2. Set RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL
 *   3. Uncomment the send block below.
 *
 * Before going live, also put a real CAPTCHA in front of this (Cloudflare
 * Turnstile or hCaptcha). The honeypot and timing checks here stop naive
 * bots; they will not stop a targeted one. The rate limiter is per-instance
 * and in-memory, which is fine for a portfolio on a single Vercel region but
 * is not a substitute for an edge rate limit at real volume.
 */

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  message?: string;
  subject?: string;
  /** Honeypot. Deliberately meaningless name so autofill leaves it alone. */
  hpReference?: string;
  elapsed?: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Bots submit the instant the DOM is ready; humans do not. */
const MIN_FILL_MS = 3_000;
const MAX_MESSAGE_LEN = 5_000;

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
  const message = (payload.message ?? "").trim();
  const subject = (payload.subject ?? "Project enquiry").trim();

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
  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 20) {
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

  if (!apiKey || !to || !from) {
    return NextResponse.json(
      {
        message:
          "This form isn't connected to an email service yet, so your message wasn't sent. Please email me directly in the meantime.",
      },
      { status: 503 }
    );
  }

  /*
  // Step 3: uncomment once `resend` is installed and the vars are set.
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Portfolio — ${subject} — ${name}`,
    text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
  });

  if (error) {
    console.error("[contact] send failed", error);
    return NextResponse.json(
      { message: "Couldn't send that message. Please email me directly." },
      { status: 502 }
    );
  }
  */

  return NextResponse.json({
    message: "Message sent. I'll come back to you soon.",
  });
}
