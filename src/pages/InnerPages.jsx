import PageHeader from '../components/layout/PageHeader';
import AboutSection from '../components/sections/AboutSection';
import LeadershipSection from '../components/sections/LeadershipSection';
import StatsSection from '../components/sections/StatsSection';
import ServicesSection from '../components/sections/ServicesSection';
import ProcessSection from '../components/sections/ProcessSection';
import ProjectsSection from '../components/sections/ProjectsSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import ContactSection from '../components/sections/ContactSection';
import FAQSection from '../components/sections/FAQSection';
import CtaBand from '../components/sections/CtaBand';

export { default as Home } from './Home';

export const AboutPage = () => (
  <>
    <PageHeader title="About Noor Electric Renewables" crumb="About" subtitle="Noor Electric (Pvt.) Ltd. — 4+ years and 500+ domestic and commercial solar projects across KP and Islamabad." />
    <AboutSection />
    <LeadershipSection tone="soft" />
    <StatsSection />
    <CtaBand />
  </>
);

export const ServicesPage = () => (
  <>
    <PageHeader title="Solar services" crumb="Services" subtitle="Residential, commercial and hybrid systems — designed, installed and supported by one team." />
    <ServicesSection tone="white" />
    <ProcessSection />
    <FAQSection />
    <CtaBand />
  </>
);

export const ProjectsPage = () => (
  <>
    <PageHeader title="Our projects" crumb="Projects" subtitle="A selection of recent installations across Islamabad, Peshawar and KP." />
    <ProjectsSection />
    <TestimonialsSection />
    <CtaBand bg="#f3f6fc" />
  </>
);

export const ContactPage = () => (
  <>
    <PageHeader title="Contact us" crumb="Contact" subtitle="Book a free site survey or ask an engineer a question — we usually reply the same day." />
    <ContactSection />
  </>
);
