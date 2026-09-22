/**
 * Technology stack. Deliberately no proficiency percentages or star ratings —
 * they are unverifiable and every reader discounts them anyway. Each entry
 * instead carries a short note on how the tool is actually used.
 */

export type StackItem = {
  name: string;
  note: string;
};

export type StackGroup = {
  id: string;
  index: string;
  title: string;
  blurb: string;
  items: StackItem[];
};

export const stack: StackGroup[] = [
  {
    id: "frontend",
    index: "01",
    title: "Frontend",
    blurb: "Interfaces, rendering strategy and motion.",
    items: [
      { name: "React.js", note: "Component architecture and state" },
      { name: "Next.js", note: "Routing, rendering and SEO foundations" },
      { name: "TypeScript", note: "Typed contracts across the app" },
      { name: "JavaScript", note: "The language underneath all of it" },
      { name: "Tailwind CSS", note: "Design-system-driven styling" },
      { name: "Framer Motion", note: "Component-level transitions" },
      { name: "GSAP", note: "Scroll-driven and timeline animation" },
      { name: "Three.js / R3F", note: "WebGL, used where it earns its cost" },
    ],
  },
  {
    id: "backend",
    index: "02",
    title: "Backend",
    blurb: "Services, data and the APIs between them.",
    items: [
      { name: "Node.js", note: "Server-side runtime" },
      { name: "Express.js", note: "REST services and middleware" },
      { name: "Strapi CMS", note: "Content modelling and custom backends" },
      { name: "MongoDB", note: "Document data modelling" },
      { name: "REST APIs", note: "Designing and consuming endpoints" },
      { name: "API optimisation", note: "Payload shape and response times" },
    ],
  },
  {
    id: "integrations",
    index: "03",
    title: "Integrations",
    blurb: "Third-party systems wired into the product.",
    items: [
      { name: "Resend", note: "Transactional email" },
      { name: "Mailchimp", note: "Audience and campaign integration" },
      { name: "OpenAI API", note: "Conversational features" },
      { name: "Google Analytics", note: "Measurement" },
      { name: "Google Tag Manager", note: "Tag and event management" },
    ],
  },
  {
    id: "delivery",
    index: "04",
    title: "Delivery",
    blurb: "How it ships and stays shipped.",
    items: [
      { name: "Git & GitHub", note: "Version control and review" },
      { name: "Vercel", note: "Frontend deployment" },
      { name: "Render", note: "Backend service hosting" },
      { name: "Strapi Cloud", note: "Managed CMS hosting" },
    ],
  },
];

/** Flat list used by the marquee. */
export const allTech = stack.flatMap((g) => g.items.map((i) => i.name));
