import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const FAQContainer = styled.section`
  padding: 80px 6%;
  background: ${colors.grey};
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
  text-align: center;
`;

const FAQWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  background: ${colors.light};
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Question = styled.button`
  width: 100%;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${colors.light};
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  text-align: left;
  color: ${colors.dark};
  transition: 0.3s;

  &:hover {
    background: ${colors.grey};
  }

  .icon {
    color: ${colors.primaryOrange};
  }
`;

const Answer = styled.div`
  padding: ${props => props.isOpen ? '20px' : '0 20px'};
  max-height: ${props => props.isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  border-top: ${props => props.isOpen ? `1px solid ${colors.grey}` : 'none'};
`;

const faqs = [
  {
    question: "How much can I save with solar panels?",
    answer: "Savings vary based on energy consumption, location, and system size. On average, homeowners can save 20-30% on their electricity bills. We provide detailed savings calculations during consultation."
  },
  {
    question: "How long does installation take?",
    answer: "A typical residential installation takes 1-3 days, while commercial projects may take 1-2 weeks. The exact timeline depends on system size and complexity."
  },
  {
    question: "What maintenance is required?",
    answer: "Solar panels require minimal maintenance. We recommend annual inspections and cleaning to ensure optimal performance. Our maintenance packages provide comprehensive care."
  },
  {
    question: "Are there government incentives available?",
    answer: "Yes, various federal, state, and local incentives are available. These can include tax credits, rebates, and grants. Our team will help you identify all applicable incentives."
  },
  {
    question: "What happens during power outages?",
    answer: "Standard grid-tied systems will shut off during outages for safety. However, systems with battery backup can continue providing power to essential appliances."
  }
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <FAQContainer id="faq">
      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FAQWrapper>
        {faqs.map((faq, index) => (
          <FAQItem key={index}>
            <Question onClick={() => toggleFAQ(index)}>
              {faq.question}
              <FontAwesomeIcon 
                icon={openIndex === index ? faMinus : faPlus} 
                className="icon"
              />
            </Question>
            <Answer isOpen={openIndex === index}>
              {faq.answer}
            </Answer>
          </FAQItem>
        ))}
      </FAQWrapper>
    </FAQContainer>
  );
}

export default FAQSection; 