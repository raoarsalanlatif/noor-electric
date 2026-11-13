import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faSun, faCarBattery, faCloudBolt, faBroom } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { Container, ButtonLink, Reveal } from '../ui/primitives';

const fall = keyframes`
  0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(320px) rotate(220deg); opacity: 0; }
`;

const Wrap = styled.section`
  padding: clamp(56px, 8vw, 96px) 0;
  background: #fff;
`;

const Box = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  padding: clamp(28px, 5vw, 56px);
  background:
    radial-gradient(600px 300px at 85% 20%, #ffb3002a, transparent 60%),
    linear-gradient(140deg, #060b18, #0e1d45 55%, #13306f);
  color: #fff;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 28px;
  align-items: center;
  @media (max-width: 860px) { grid-template-columns: 1fr; }
  h2 { color: #fff; font-size: clamp(1.9rem, 4vw, 2.8rem); font-weight: 800; margin: 12px 0 12px; }
  h2 span { background: linear-gradient(90deg, ${brand.gold}, ${brand.orange}, ${brand.red}); -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { color: rgba(255,255,255,0.75); max-width: 480px; margin-bottom: 24px; }
  .tag { display: inline-flex; align-items: center; gap: 8px; font-family: ${fonts.heading}; font-weight: 700; font-size: 0.78rem;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${brand.gold}; }
`;

const Rain = styled.div`
  position: relative;
  height: 280px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
  .drop { position: absolute; top: 0; animation: ${fall} linear infinite; font-size: 1.5rem; }
  .roof { position: absolute; left: 10%; right: 10%; bottom: 26px; height: 10px; border-radius: 4px; background: #cbbfa8; }
  .panel { position: absolute; bottom: 44px; left: 42%; width: 70px; height: 12px; border-radius: 3px;
    background: linear-gradient(90deg, #13306b, #1d4fb4); box-shadow: 0 0 20px #ffd23f88; animation: ${keyframes`0%,100%{transform:translateX(-50px)}50%{transform:translateX(50px)}`} 3.2s ease-in-out infinite; }
`;

const DROPS = [
  { icon: faSun, c: '#ffd23f', l: '12%', d: '0s', t: '2.6s' },
  { icon: faSun, c: '#ffd23f', l: '38%', d: '0.9s', t: '2.2s' },
  { icon: faBroom, c: '#d6a46a', l: '60%', d: '0.4s', t: '2.9s' },
  { icon: faCarBattery, c: '#4ade80', l: '78%', d: '1.6s', t: '3.1s' },
  { icon: faSun, c: '#ffd23f', l: '52%', d: '2.1s', t: '2.4s' },
  { icon: faCloudBolt, c: '#f87171', l: '25%', d: '1.3s', t: '3.3s' },
];

function GamePromo() {
  return (
    <Wrap>
      <Container>
        <Reveal>
          <Box>
            <div>
              <span className="tag"><FontAwesomeIcon icon={faGamepad} /> Take a break</span>
              <h2>Play <span>Solar Rush</span></h2>
              <p>Catch the sunshine, dodge dust storms and lightning, and keep the house lit through the night. How many days can you survive?</p>
              <ButtonLink to="/play"><FontAwesomeIcon icon={faGamepad} /> Play now — it’s free</ButtonLink>
            </div>
            <Rain aria-hidden="true">
              {DROPS.map((d, i) => (
                <span key={i} className="drop" style={{ left: d.l, animationDelay: d.d, animationDuration: d.t, color: d.c }}><FontAwesomeIcon icon={d.icon} /></span>
              ))}
              <div className="panel" />
              <div className="roof" />
            </Rain>
          </Box>
        </Reveal>
      </Container>
    </Wrap>
  );
}

export default GamePromo;
