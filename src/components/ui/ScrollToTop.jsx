import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const ScrollButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${colors.primaryOrange};
  color: ${colors.light};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: ${props => props.visible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  transition: 0.3s;
  z-index: 999;

  &:hover {
    background: ${colors.primaryBlue};
    transform: translateY(-3px);
  }
`;

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <ScrollButton visible={isVisible} onClick={scrollToTop}>
      <FontAwesomeIcon icon={faArrowUp} />
    </ScrollButton>
  );
}

export default ScrollToTop; 