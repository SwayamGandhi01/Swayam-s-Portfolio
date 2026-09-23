import { site } from "@/data/site";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/ui/RevealText";
import { Editable, EditableLink } from "@/components/ui/Editable";
import { CopyButton } from "@/components/ui/CopyButton";
import { ContactForm } from "@/components/contact/ContactForm";

export function Contact() {
  return (
    <Section id="contact" className="pb-28">
      <div className="hairline-t pt-6">
        <Reveal stagger={0.08}>
          <div className="label flex items-center gap-3 text-muted">
            <span className="text-signal">07</span>
            <span aria-hidden className="h-px w-8 bg-[var(--line-strong)]" />
            <span>Contact</span>
          </div>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <RevealText as="h2" className="text-d2 font-semibold" stagger={0.08}>
            Got something you&rsquo;d like{" "}
            <span className="em-serif text-signal">built</span>?
          </RevealText>

          <Reveal stagger={0.1} className="mt-8 space-y-6">
            <p className="max-w-[44ch] text-lead text-muted">
              Whether it&rsquo;s a frontend that needs rebuilding, an API that
              needs designing, or a CMS that needs to stop getting in
              everyone&rsquo;s way — tell me what you&rsquo;re working on.
            </p>

            <dl className="hairline-t pt-6">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <dt className="label shrink-0 text-muted">Email</dt>
                <dd className="flex min-w-0 items-center gap-2.5">
                  <a
                    href={`mailto:${site.email}`}
                    className="truncate text-sm transition-colors hover:text-signal"
                  >
                    {site.email}
                  </a>
                  <CopyButton value={site.email} label="email address" />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <dt className="label shrink-0 text-muted">Phone</dt>
                <dd className="flex min-w-0 items-center gap-2.5">
                  {/* href is E.164; the visible text is the grouped form. */}
                  <a
                    href={`tel:${site.phone}`}
                    className="truncate text-sm tabular-nums transition-colors hover:text-signal"
                  >
                    {site.phoneDisplay}
                  </a>
                  <CopyButton value={site.phone} label="phone number" />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <dt className="label shrink-0 text-muted">Based</dt>
                <dd className="text-sm">
                  <Editable value={site.location} />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <dt className="label shrink-0 text-muted">Elsewhere</dt>
                <dd className="flex flex-wrap justify-end gap-x-5 gap-y-1 text-sm">
                  {site.socials.map((s) => (
                    <EditableLink
                      key={s.label}
                      href={s.href}
                      fallbackLabel="url pending"
                      className="transition-colors hover:text-signal"
                    >
                      {s.label}
                    </EditableLink>
                  ))}
                </dd>
              </div>
            </dl>

          </Reveal>
        </div>

        <div className="lg:col-span-7 lg:pl-8">
          <Reveal y={36}>
            <div className="relative rounded-sm border border-[var(--line)] bg-ink-2/60 p-7 sm:p-10">
              <div
                aria-hidden
                className="blueprint pointer-events-none absolute inset-0 opacity-30"
              />
              <div className="relative">
                <ContactForm />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
