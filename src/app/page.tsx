import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Stack } from "@/components/sections/Stack";
import { Projects } from "@/components/sections/Projects";
import { Journey } from "@/components/sections/Journey";
import { Services } from "@/components/sections/Services";
import { Contact } from "@/components/sections/Contact";

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
