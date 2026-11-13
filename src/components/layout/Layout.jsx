import styled from 'styled-components';
import Navbar from './Navbar';
import Footer from './Footer';

const MainContent = styled.main`
  min-height: 100vh;
  padding-top: 76px; /* fixed navbar */
  @media (max-width: 600px) { padding-top: 68px; }
`;

// eslint-disable-next-line react/prop-types
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <MainContent>{children}</MainContent>
      <Footer />
    </>
  );
}

export default Layout;
