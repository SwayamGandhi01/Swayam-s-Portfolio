"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/data/site";

type Status = "idle" | "submitting" | "success" | "error";
type Errors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Phone is checked by counting digits, not by matching a format.
 *
 * Formats vary wildly by country — spaces, dots, dashes, brackets, leading
 * zeros, +country codes — and a strict pattern mostly succeeds at rejecting
 * real numbers from people trying to hire you. So: allow the punctuation
 * people actually type, then require 7–15 digits. 15 is the E.164 maximum;
 * below 7 nothing is dialable.
 */
const PHONE_ALLOWED_RE = /^[+\d\s().-]+$/;

export function validatePhone(raw: string): string | undefined {
  const phone = raw.trim();
  if (!phone) return undefined; // Optional — blank is valid.
  if (!PHONE_ALLOWED_RE.test(phone))
    return "Digits, spaces and + ( ) - . only, please.";
  const digits = phone.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15)
    return "Please enter a valid phone number, or leave it blank.";
  return undefined;
}

function validate(values: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2)
    errors.name = "Please enter your name (2 characters or more).";
  if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Please enter a valid email address.";

  const phoneError = validatePhone(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (values.message.trim().length < 20)
    errors.message = "A little more detail, please — at least 20 characters.";
  return errors;
}

/**
 * Contact form.
 *
 * Deliberately *not* wired to an email provider — `/api/contact` reports that
 * it is unconfigured until credentials are supplied, and this form surfaces
 * that message verbatim. It never shows a success state for a message that
 * was not actually delivered.
 *
 * Spam handling is layered: a honeypot field no human ever sees, a minimum
 * time-to-complete (bots submit instantly), and per-IP rate limiting on the
 * server. See the route for what a production deployment should add.
 *
 * Accessibility: every field has a real `<label>`, errors are wired through
 * `aria-describedby` + `aria-invalid`, the first invalid field takes focus on
 * a failed submit, and status changes are announced via a live region.
 */
export function ContactForm() {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const mountedAt = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // Stamped after mount rather than during render — the timing check only
  // needs a reference point for "when could a human have started typing".
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const fid = (name: string) => `${uid}-${name}`;
  const eid = (name: string) => `${uid}-${name}-error`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
      subject: String(data.get("subject") ?? ""),
      hpReference: String(data.get("hp_reference") ?? ""), // honeypot
      elapsed: Date.now() - mountedAt.current,
    };

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      setFeedback(null);
      const firstInvalid = Object.keys(nextErrors)[0];
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    setFeedback(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
      };

      if (res.ok) {
        setStatus("success");
        setFeedback(body.message ?? "Message sent. I'll come back to you soon.");
        form.reset();
        mountedAt.current = Date.now();
      } else {
        setStatus("error");
        setFeedback(
          body.message ??
            `Something went wrong sending that. Please email me at ${site.email}.`
        );
      }
    } catch {
      setStatus("error");
      setFeedback(
        `Couldn't reach the server. Check your connection, or email ${site.email}.`
      );
    }
  }

  const fieldClass = (invalid?: string) =>
    cn(
      "w-full rounded-sm border bg-transparent px-0 py-3.5 text-[0.9375rem] outline-none",
      "border-0 border-b transition-colors duration-300 placeholder:text-muted",
      invalid
        ? "border-red-400/80 focus:border-red-400"
        : "border-[var(--line-strong)] focus:border-signal"
    );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-8">
      {/* Honeypot. Positioned off-screen rather than `display:none`, because
          many bots skip fields that aren't rendered. The field name is
          deliberately meaningless — calling it "company" or "phone" invites a
          password manager to autofill it and silently drop a real message. */}
      <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor={fid("hp_reference")}>Leave this field empty</label>
        <input
          id={fid("hp_reference")}
          name="hp_reference"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor={fid("name")} className="label block text-muted">
            Full name <span className="text-signal">*</span>
          </label>
          <input
            id={fid("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? eid("name") : undefined}
            placeholder="Jane Doe"
            className={cn("mt-3", fieldClass(errors.name))}
          />
          {errors.name && (
            <p id={eid("name")} className="mt-2 text-xs text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fid("email")} className="label block text-muted">
            Email <span className="text-signal">*</span>
          </label>
          <input
            id={fid("email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? eid("email") : undefined}
            placeholder="jane@company.com"
            className={cn("mt-3", fieldClass(errors.email))}
          />
          {errors.email && (
            <p id={eid("email")} className="mt-2 text-xs text-red-400">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor={fid("phone")} className="label block text-muted">
            Phone <span className="opacity-60">(optional)</span>
          </label>
          <input
            id={fid("phone")}
            name="phone"
            // `tel` keeps the field permissive — browsers don't second-guess
            // international formats the way they do with `email`. `inputMode`
            // is what actually brings up the dial pad on a phone.
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? eid("phone") : undefined}
            placeholder="+91 98765 43210"
            className={cn("mt-3", fieldClass(errors.phone))}
          />
          {errors.phone && (
            <p id={eid("phone")} className="mt-2 text-xs text-red-400">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fid("subject")} className="label block text-muted">
            Project type
          </label>
          <select
            id={fid("subject")}
            name="subject"
            defaultValue="Full stack build"
            className={cn("mt-3 cursor-pointer", fieldClass())}
          >
            {[
              "Full stack build",
              "Frontend work",
              "Backend / API work",
              "Strapi CMS work",
              "Landing page",
              "Redesign / modernisation",
              "Performance work",
              "Something else",
            ].map((option) => (
              <option key={option} value={option} className="bg-surface">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={fid("message")} className="label block text-muted">
          Message <span className="text-signal">*</span>
        </label>
        <textarea
          id={fid("message")}
          name="message"
          rows={5}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? eid("message") : undefined}
          placeholder="A sentence or two about what you're building and where you'd like help."
          className={cn("mt-3 resize-y", fieldClass(errors.message))}
        />
        {errors.message && (
          <p id={eid("message")} className="mt-2 text-xs text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-medium tracking-tight",
            "bg-signal text-on-signal transition-colors duration-300",
            "hover:bg-content disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {status === "submitting" && (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          )}
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>

        <p className="label text-muted">Usually replies within a few days</p>
      </div>

      {/* Single live region for every outcome. */}
      <div aria-live="polite" role="status" className="min-h-6">
        {feedback && (
          <p
            className={cn(
              "flex items-start gap-2.5 text-sm",
              status === "success" ? "text-signal" : "text-red-400"
            )}
          >
            {status === "success" ? (
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{feedback}</span>
          </p>
        )}
      </div>
    </form>
  );
}
