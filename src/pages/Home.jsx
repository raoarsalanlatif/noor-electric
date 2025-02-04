import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { colors } from '../styles/variables';
import ServicesSection from '../components/sections/ServicesSection';
import ProjectsSection from '../components/sections/ProjectsSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import GallerySection from '../components/sections/GallerySection';
import FAQSection from '../components/sections/FAQSection';
import StatsSection from '../components/sections/StatsSection';
import ScrollToTop from '../components/ui/ScrollToTop';
import WhatsAppButton from '../components/ui/WhatsAppButton';
import AboutSection from '../components/sections/AboutSection';

const HeroSection = styled.section`
  height: 100vh;
  background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
              url('https://via.placeholder.com/1920x1080') center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${colors.light};
`;

const HeroContent = styled.div`
  h1 {
    font-size: 48px;
    margin-bottom: 20px;
  }
  p {
    font-size: 20px;
    margin-bottom: 30px;
  }
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 12px 30px;
  background: ${colors.primaryOrange};
  color: ${colors.light};
  text-decoration: none;
  border-radius: 5px;
  transition: 0.3s;

  &:hover {
    background: ${colors.primaryBlue};
    transform: translateY(-2px);
  }
`;

function Home() {
  return (
    <>
      <HeroSection>
        <HeroContent>
          <h1>Powering Tomorrow with Solar Energy</h1>
          <p>Your trusted partner in renewable energy solutions</p>
          <CTAButton to="/contact">Get Started</CTAButton>
        </HeroContent>
      </HeroSection>
      <ServicesSection />
      <StatsSection />
      <ProjectsSection />
      <GallerySection />
      <TestimonialsSection />
      <AboutSection />
      <FAQSection />
      <ScrollToTop />
      <WhatsAppButton />
    </>
  );
}

export default Home;