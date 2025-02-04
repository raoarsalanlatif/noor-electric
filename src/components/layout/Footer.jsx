import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { colors } from '../../styles/variables';

const FooterContainer = styled.footer`
  background: ${colors.dark};
  color: ${colors.light};
  padding: 40px 6% 20px;
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
`;

const FooterSection = styled.div`
  h3 {
    color: ${colors.primaryOrange};
    margin-bottom: 20px;
  }

  ul {
    list-style: none;
  }

  li {
    margin: 10px 0;
  }

  a {
    color: ${colors.light};
    text-decoration: none;
    &:hover {
      color: ${colors.primaryOrange};
    }
  }
`;

const SocialLinks = styled.div`
  a {
    margin-right: 15px;
    font-size: 20px;
  }
`;

const FooterBottom = styled.div`
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>Noor Electric Renewables</h3>
          <p>Sustainable energy solutions for a brighter future.</p>
        </FooterSection>
        
        <FooterSection>
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Follow Us</h3>
          <SocialLinks>
            <a href="#"><FontAwesomeIcon icon={faFacebook} /></a>
            <a href="#"><FontAwesomeIcon icon={faTwitter} /></a>
            <a href="#"><FontAwesomeIcon icon={faLinkedin} /></a>
            <a href="#"><FontAwesomeIcon icon={faInstagram} /></a>
          </SocialLinks>
        </FooterSection>
      </FooterContent>
      
      <FooterBottom>
        <p>&copy; 2024 Noor Electric Renewables. All rights reserved.</p>
      </FooterBottom>
    </FooterContainer>
  );
}

export default Footer;