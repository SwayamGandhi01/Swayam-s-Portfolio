import { allTech, stack } from "@/data/stack";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";

export function Stack() {
  return (
    <Section id="skills" bare>
      <div className="shell">
        <SectionHeading
          index="03"
          label="Skills"
          title={
            <>
              The tools I reach for, and{" "}
              <span className="em-serif text-signal">what</span> I use them for
            </>
          }
          intro="No percentages or star ratings — those measure nothing. Each tool is listed with the job it actually does in my work."
        />
      </div>

      <Reveal y={20} className="mt-16 hairline-t hairline-b py-7">
        <Marquee items={allTech} speed={58} />
      </Reveal>

      <div className="shell">
        <div className="grid gap-x-10 gap-y-14 pt-16 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((group) => (
            <Reveal key={group.id} y={32} className="min-w-0">
              <div className="group/col">
                <div className="flex items-baseline gap-3 border-t border-[var(--line-strong)] pt-5">
                  <span className="font-mono text-[0.625rem] text-signal">
                    {group.index}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {group.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-sm text-muted">{group.blurb}</p>

                <ul className="mt-7 space-y-px">
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <div className="group/item relative -mx-3 rounded-md px-3 py-2.5 transition-colors duration-300 hover:bg-surface">
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-0 w-px -translate-y-1/2 bg-signal transition-all duration-400 ease-[var(--ease-out-expo)] group-hover/item:h-[70%]"
                        />
                        <p className="text-[0.9375rem] font-medium tracking-tight transition-colors duration-300 group-hover/item:text-signal">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted">
                          {item.note}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
