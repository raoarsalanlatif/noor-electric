import { createGlobalStyle } from 'styled-components';
import { colors } from './variables';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    line-height: 1.5;
    color: ${colors.dark};
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 0.5em;
  }

  p {
    margin-bottom: 1em;
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;

export default GlobalStyles;
