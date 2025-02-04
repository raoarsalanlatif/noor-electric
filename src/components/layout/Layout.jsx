import styled from 'styled-components';
import Navbar from './Navbar';
import Footer from './Footer';

const MainContent = styled.main`
  min-height: 100vh;
  padding-top: 80px; // Height of fixed navbar
`;

// eslint-disable-next-line react/prop-types
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <MainContent>
        {children}
      </MainContent>
      <Footer />
    </>
  );
}

export default Layout;