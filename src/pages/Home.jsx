import { useEffect } from 'react';
import HeroSection from '../components/sections/HeroSection';
import ServicesSection from '../components/sections/ServicesSection';
import StatsSection from '../components/sections/StatsSection';
import PlannerPromo from '../components/sections/PlannerPromo';
import ProjectsSection from '../components/sections/ProjectsSection';
import ProcessSection from '../components/sections/ProcessSection';
import LeadershipSection from '../components/sections/LeadershipSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import FAQSection from '../components/sections/FAQSection';
import ContactSection from '../components/sections/ContactSection';
import CtaBand from '../components/sections/CtaBand';
import GamePromo from '../components/sections/GamePromo';
import { company } from '../content/company';

function Home() {
  useEffect(() => { document.title = `${company.name} | Solar Solutions for Homes & Businesses`; }, []);
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <StatsSection />
      <PlannerPromo />
      <GamePromo />
      <ProjectsSection tone="soft" />
      <LeadershipSection />
      <ProcessSection />
      <TestimonialsSection />
      <FAQSection />
      <CtaBand />
      <ContactSection />
    </>
  );
}

export default Home;
