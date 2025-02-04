import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const AboutContainer = styled.section`
  padding: 80px 6%;
  background: #fff;
`;

const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
`;

const AboutContent = styled.div`
  h2 {
    color: ${colors.primaryBlue};
    font-size: 2.2rem;
    margin-bottom: 25px;
  }

  p {
    color: #666;
    line-height: 1.8;
    margin-bottom: 20px;
  }
`;

const CEOMessage = styled.div`
  background: #f9f9f9;
  padding: 30px;
  border-radius: 10px;
  position: relative;

  .quote-icon {
    color: ${colors.primaryOrange};
    font-size: 24px;
    margin-bottom: 15px;
  }

  .ceo-name {
    color: ${colors.primaryBlue};
    font-weight: bold;
    margin-top: 20px;
  }
`;

function AboutSection() {
  return (
    <AboutContainer id="about">
      <AboutGrid>
        <AboutContent>
          <h2>About Noor Electric</h2>
          <p>
            `Founded in 2015, Noor Electric has been at the forefront of sustainable energy solutions, 
            helping businesses and homeowners transition to clean, renewable energy sources.`
          </p>
          <p>
            `Our mission is to accelerate the worlds transition to sustainable energy through 
            innovative solar solutions and exceptional customer service.`
          </p>
        </AboutContent>
        <CEOMessage>
          <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
          <p>
            `At Noor Electric, we believe in powering the future through sustainable energy solutions. 
            Our commitment to excellence and innovation drives us to deliver the best solar solutions 
            for our clients while contributing to a greener planet.`
          </p>
          <p className="ceo-name">- Sarah Johnson</p>
          <p>CEO, Noor Electric</p>
        </CEOMessage>
      </AboutGrid>
    </AboutContainer>
  );
}

export default AboutSection; 