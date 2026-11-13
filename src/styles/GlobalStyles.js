import { createGlobalStyle } from 'styled-components';
import { brand, fonts } from './variables';

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

  body {
    font-family: ${fonts.body};
    line-height: 1.6;
    color: ${brand.text};
    background: ${brand.bg};
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${fonts.heading};
    line-height: 1.2;
    color: ${brand.ink};
    letter-spacing: -0.01em;
  }

  p { margin-bottom: 0; }
  img { max-width: 100%; display: block; }
  a { color: inherit; }
  button { font: inherit; }

  :focus-visible { outline: 3px solid ${brand.gold}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
`;

export default GlobalStyles;
