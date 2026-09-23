import { site } from "@/data/site";
import { careerStartLabel, formatDuration, totalMonths } from "@/data/journey";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/ui/RevealText";
import { Editable } from "@/components/ui/Editable";
import { StackDiagram } from "@/components/about/StackDiagram";

const principles = [
  {
    title: "One system, not two halves",
    body: "Interface and API get designed against each other. Most of the friction in a project lives at that seam.",
  },
  {
    title: "Motion with a job to do",
    body: "Animation should explain a transition or direct attention. If it does neither, it is weight.",
  },
  {
    title: "Content that outlives the build",
    body: "Modelled properly in the CMS, so the site stays editable long after the first launch.",
  },
];

export function About() {
  const spec: [string, React.ReactNode][] = [
    ["Role", site.role],
    ["Based", <Editable key="loc" value={site.location} />],
    ["Since", careerStartLabel],
    ["Experience", formatDuration(totalMonths())],
    ["Focus", "React · Next.js · Node · Strapi"],
    ["Status", site.availability],
  ];

  return (
    <div className="theme-invert bg-canvas text-content">
      <Section id="about">
        <div className="grid gap-x-12 gap-y-16 lg:grid-cols-12">
          {/* ---- Narrative ---- */}
          <div className="lg:col-span-7">
            <div className="hairline-t pt-6">
              <Reveal stagger={0.08}>
                <div className="label flex items-center gap-3 text-muted">
                  <span className="text-signal">02</span>
                  <span aria-hidden className="h-px w-8 bg-[var(--line-strong)]" />
                  <span>About</span>
                </div>
              </Reveal>
            </div>

            <RevealText
              as="h2"
              className="mt-10 text-d2 font-semibold"
              stagger={0.08}
            >
              I build the whole thing — the interface people touch and the{" "}
              <span className="em-serif text-signal">systems</span> underneath
              it.
            </RevealText>

            <Reveal stagger={0.12} className="mt-9 max-w-[56ch] space-y-5">
              <p className="text-lead text-muted">
                I&rsquo;m {site.name}, a full stack developer. My work sits
                across both sides of a product: React and Next.js on the front,
                Node, Express and Strapi behind it, and the integrations —
                email, analytics, AI APIs — that make the two useful together.
              </p>
              <p className="text-lead text-muted">
                In practice that has meant migrating a React application to
                Next.js and rebuilding its SEO along the way, modelling content
                in Strapi so editorial teams aren&rsquo;t blocked on
                developers, building Express services behind forms and chat,
                and automating a daily news pipeline so nobody has to run it by
                hand.
              </p>
              <p className="text-lead text-muted">
                The part I care most about is the seam between the two: how the
                API is shaped, what it costs to render, and whether the people
                editing the content afterwards can actually do their job.
              </p>
            </Reveal>
          </div>

          {/* ---- Cross-section of the stack, plus the spec plate ---- */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal y={32}>
                <p className="label text-muted">Anatomy of a build</p>
              </Reveal>

              <StackDiagram className="mt-6" />

              <Reveal y={24} className="mt-10">
                <dl className="border-t border-[var(--line-strong)]">
                  {spec.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3.5"
                    >
                      <dt className="label text-muted">{key}</dt>
                      <dd className="text-right text-sm font-medium tracking-tight">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </div>

        {/* ---- Principles, full width so three columns have room ---- */}
        <Reveal
          stagger={0.1}
          className="mt-24 grid gap-x-10 gap-y-9 sm:grid-cols-3"
        >
          {principles.map((principle) => (
            <div
              key={principle.title}
              // A rule per item rather than one on the container, so each
              // still reads as its own column when they stack on mobile.
              className="border-t border-[var(--line-strong)] pt-5"
            >
              <h3 className="text-base font-semibold tracking-tight">
                {principle.title}
              </h3>
              <p className="mt-2.5 max-w-[34ch] text-sm leading-relaxed text-muted">
                {principle.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Section>
    </div>
  );
}
