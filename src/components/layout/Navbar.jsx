import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { colors, breakpoints } from '../../styles/variables';

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 6%;
  background: ${colors.light};
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Logo = styled(Link)`
  color: ${colors.primaryBlue};
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
`;

const NavLinks = styled.div`
  @media (max-width: ${breakpoints.mobile}) {
    position: fixed;
    top: 0;
    right: ${props => props.isOpen ? '0' : '-70%'};
    height: 100vh;
    width: 70%;
    background: ${colors.primaryBlue};
    transition: 0.3s ease-in-out;
    padding: 2rem;
  }
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  
  @media (max-width: ${breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const NavItem = styled.li`
  margin: 0 1rem;
  
  @media (max-width: ${breakpoints.mobile}) {
    margin: 1rem 0;
  }
`;

const NavLink = styled(Link)`
  color: ${colors.dark};
  text-decoration: none;
  transition: 0.3s;

  &:hover {
    color: ${colors.primaryOrange};
  }

  @media (max-width: ${breakpoints.mobile}) {
    color: ${colors.light};
  }
`;

const MenuIcon = styled.div`
  display: none;
  cursor: pointer;
  
  @media (max-width: ${breakpoints.mobile}) {
    display: block;
  }
`;

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <Nav>
      <Logo to="/">Noor Electric</Logo>
      <MenuIcon onClick={toggleMenu}>
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
      </MenuIcon>
      <NavLinks isOpen={isOpen}>
        <NavList>
          <NavItem><NavLink to="/" onClick={toggleMenu}>Home</NavLink></NavItem>
          <NavItem><NavLink to="/about" onClick={toggleMenu}>About Us</NavLink></NavItem>
          <NavItem><NavLink to="/services" onClick={toggleMenu}>Services</NavLink></NavItem>
          <NavItem><NavLink to="/projects" onClick={toggleMenu}>Projects</NavLink></NavItem>
          <NavItem><NavLink to="/contact" onClick={toggleMenu}>Contact</NavLink></NavItem>
        </NavList>
      </NavLinks>
    </Nav>
  );
}

export default Navbar;