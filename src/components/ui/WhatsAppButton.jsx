import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useLocation } from 'react-router-dom';
import { whatsappLink } from '../../content/company';

const ring = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
  70% { box-shadow: 0 0 0 16px rgba(37,211,102,0); }
  100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
`;

const Fab = styled.a`
  position: fixed;
  bottom: 22px;
  right: 22px;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #25d366;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 30px;
  z-index: 999;
  animation: ${ring} 2.4s infinite;
  transition: transform 0.2s;
  &:hover { transform: scale(1.08); }
  @media (max-width: 600px) { bottom: 16px; right: 16px; width: 52px; height: 52px; font-size: 27px; }
`;

function WhatsAppButton() {
  const { pathname } = useLocation();
  if (pathname === '/play') return null;
  return (
    <Fab href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      <FontAwesomeIcon icon={faWhatsapp} />
    </Fab>
  );
}

export default WhatsAppButton;
