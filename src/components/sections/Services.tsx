import { services } from "@/data/services";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function Services() {
  return (
    <Section id="services">
      <SectionHeading
        index="06"
        label="Services"
        title={
          <>
            What I can take{" "}
            <span className="em-serif text-signal">on</span>
          </>
        }
        intro="Scoped to work I have actually delivered. If something isn't here, it's because I haven't done it yet."
      />

      {/* Hairline grid: one shared border set, so the cards read as a single
          drawn table rather than seven floating boxes. */}
      <div className="mt-20 grid border-l border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <Reveal
            key={service.index}
            y={24}
            delay={(i % 3) * 0.06}
            className="border-b border-r border-[var(--line)]"
          >
            <div className="group relative h-full overflow-hidden p-7 lg:p-9">
              {/* Accent wash rises on hover — transform only. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-surface transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-y-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-signal transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100"
              />

              <div className="relative flex h-full flex-col">
                <span className="font-mono text-[0.625rem] tracking-[0.16em] text-signal">
                  {service.index}
                </span>

                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {service.title}
                </h3>

                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                  {service.body}
                </p>

                <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 pt-6">
                  {service.deliverables.map((d) => (
                    <li key={d} className="label text-muted">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
