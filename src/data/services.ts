/**
 * Services — scoped strictly to work that has actually been done. Each entry
 * names the delivery so it reads as capability, not advertising.
 */

export type Service = {
  index: string;
  title: string;
  body: string;
  deliverables: string[];
};

export const services: Service[] = [
  {
    index: "01",
    title: "Full stack web development",
    body: "Interface, API and content layer built as one system rather than three handoffs.",
    deliverables: ["Next.js frontend", "Node/Express services", "Data modelling"],
  },
  {
    index: "02",
    title: "Frontend development",
    body: "React and Next.js interfaces with considered typography, responsive behaviour and motion that has a reason to exist.",
    deliverables: ["React / Next.js", "Tailwind CSS", "GSAP & Framer Motion"],
  },
  {
    index: "03",
    title: "Backend & API development",
    body: "REST services in Node and Express, with attention to payload shape and response times rather than just endpoints that return 200.",
    deliverables: ["REST APIs", "MongoDB", "API optimisation"],
  },
  {
    index: "04",
    title: "Strapi CMS development",
    body: "Content modelling, custom backend work and the API surface a frontend can actually consume — plus automation where editors shouldn't be doing manual work.",
    deliverables: ["Content models", "Custom endpoints", "Content automation"],
  },
  {
    index: "05",
    title: "Performance optimisation",
    body: "Finding what's actually slow — render strategy, payload size, animation cost — and measuring before and after rather than asserting an improvement.",
    deliverables: ["Render strategy", "Bundle & asset audit", "Core Web Vitals"],
  },
  {
    index: "06",
    title: "Third-party integrations",
    body: "Wiring external systems in cleanly: transactional email, audience tools, analytics and AI APIs.",
    deliverables: ["Resend & Mailchimp", "OpenAI API", "GA4 & GTM"],
  },
  {
    index: "07",
    title: "Redesign & modernisation",
    body: "Taking an existing site and bringing it forward — visual direction, framework migration, and the SEO groundwork that usually needs redoing alongside it.",
    deliverables: ["Visual redesign", "Framework migration", "SEO foundations"],
  },
];
