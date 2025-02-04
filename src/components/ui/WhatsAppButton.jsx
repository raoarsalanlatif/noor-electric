import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { colors } from '../../styles/variables';

const WhatsAppLink = styled.a`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: #25D366;
  color: ${colors.light};
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: 0.3s;
  z-index: 999;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 15px rgba(0,0,0,0.3);
  }
`;

function WhatsAppButton() {
  // Replace with your WhatsApp number
  const whatsappNumber = '+1234567890';
  const message = 'Hello! I would like to know more about your solar solutions.';

  return (
    <WhatsAppLink 
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
    >
      <FontAwesomeIcon icon={faWhatsapp} />
    </WhatsAppLink>
  );
}

export default WhatsAppButton; 