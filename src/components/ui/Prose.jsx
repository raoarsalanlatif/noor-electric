import styled from 'styled-components';

/** Typography for rendered blog articles. */
const Prose = styled.div`
  color: #273142; line-height: 1.75; font-size: 1.02rem;
  h2, h3, h4 { margin: 1.4em 0 0.5em; color: #0b1530; }
  p { margin: 0 0 1em; }
  ul, ol { margin: 0 0 1em 1.3em; }
  li { margin: 0.25em 0; }
  img { max-width: 100%; border-radius: 12px; margin: 0.5em 0; }
  a { color: #1a4fb4; }
  blockquote { margin: 1em 0; padding: 10px 16px; border-left: 4px solid #f7b31b; background: #fffaeb; border-radius: 0 10px 10px 0; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-size: 0.9em; }
`;

export default Prose;
