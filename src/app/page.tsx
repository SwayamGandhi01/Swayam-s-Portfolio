import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Stack } from "@/components/sections/Stack";
import { Projects } from "@/components/sections/Projects";
import { Journey } from "@/components/sections/Journey";
import { Services } from "@/components/sections/Services";
import { Contact } from "@/components/sections/Contact";

/**
 * Regenerate this page once a day.
 *
 * The experience figures in the hero, About and Experience sections are all
 * derived from today's date. That derivation runs when the page is rendered —
 * and a statically generated page renders once, at build time, so the numbers
 * would freeze at whatever they were on the day of the last deploy. Without
 * this, the site would still say "1 yr 11 mos" next November.
 *
 * A daily rebuild keeps them current with no deploy needed. The values only
 * change on the first of a month, so a day's granularity is ample.
 *
 * Must stay a literal: Next requires this to be statically analysable, so
 * `60 * 60 * 24` would not work here.
 */
export const revalidate = 86400;

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Stack />
      <Projects />
      <Journey />
      <Services />
      <Contact />
    </>
  );
}
