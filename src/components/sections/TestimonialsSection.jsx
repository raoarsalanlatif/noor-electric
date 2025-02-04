import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const TestimonialsContainer = styled.section`
  padding: 80px 6%;
  background: ${colors.grey};
  text-align: center;
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
`;

const TestimonialCard = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: ${colors.light};
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
`;

const QuoteIcon = styled.div`
  color: ${colors.primaryOrange};
  font-size: 2rem;
  margin-bottom: 20px;
`;

const TestimonialText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const ClientName = styled.h4`
  color: ${colors.primaryBlue};
  margin-bottom: 5px;
`;

const ClientTitle = styled.p`
  color: #666;
  font-style: italic;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: ${colors.primaryBlue};
  font-size: 1.5rem;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    color: ${colors.primaryOrange};
  }

  &:disabled {
    color: ${colors.greyDark};
    cursor: not-allowed;
  }
`;

const testimonials = [
  {
    text: "Noor Electric transformed our home with their solar installation. We're saving money and helping the environment!",
    name: "John Smith",
    title: "Homeowner"
  },
  {
    text: "Professional team, excellent service. Our business has seen significant reduction in energy costs since installation.",
    name: "Sarah Johnson",
    title: "Business Owner"
  },
  {
    text: "The maintenance service is outstanding. They keep our solar system running at peak efficiency.",
    name: "Michael Brown",
    title: "Property Manager"
  }
];

function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex(current => (current > 0 ? current - 1 : current));
  };

  const handleNext = () => {
    setCurrentIndex(current => (current < testimonials.length - 1 ? current + 1 : current));
  };

  return (
    <TestimonialsContainer>
      <SectionTitle>What Our Clients Say</SectionTitle>
      <TestimonialCard>
        <QuoteIcon>
          <FontAwesomeIcon icon={faQuoteLeft} />
        </QuoteIcon>
        <TestimonialText>{testimonials[currentIndex].text}</TestimonialText>
        <ClientName>{testimonials[currentIndex].name}</ClientName>
        <ClientTitle>{testimonials[currentIndex].title}</ClientTitle>
      </TestimonialCard>
      <NavigationButtons>
        <NavButton 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </NavButton>
        <NavButton 
          onClick={handleNext} 
          disabled={currentIndex === testimonials.length - 1}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </NavButton>
      </NavigationButtons>
    </TestimonialsContainer>
  );
}

export default TestimonialsSection; 