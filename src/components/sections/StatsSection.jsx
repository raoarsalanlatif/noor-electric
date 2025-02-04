import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSolarPanel, faHome, faUsers, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const StatsContainer = styled.section`
  padding: 60px 6%;
  background: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)),
              url('https://via.placeholder.com/1920x1080') center/cover;
  color: ${colors.light};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 20px;

  .icon {
    font-size: 2.5rem;
    color: ${colors.primaryOrange};
    margin-bottom: 15px;
  }

  .number {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 10px;
    color: ${colors.primaryBlue};
  }

  .label {
    font-size: 1.1rem;
  }
`;

const stats = [
  {
    icon: faSolarPanel,
    end: 500,
    label: "Installations Completed",
    suffix: "+"
  },
  {
    icon: faHome,
    end: 1000,
    label: "Homes Powered",
    suffix: "+"
  },
  {
    icon: faUsers,
    end: 2000,
    label: "Happy Customers",
    suffix: "+"
  },
  {
    icon: faLeaf,
    end: 5000,
    label: "CO₂ Tons Saved",
    suffix: "+"
  }
];

function StatsSection() {
  const [counters, setCounters] = useState(stats.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          animateNumbers();
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateNumbers = () => {
    const duration = 2000; // 2 seconds
    const steps = 50;
    const stepTime = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep === steps) {
        clearInterval(interval);
        return;
      }

      setCounters(prevCounters =>
        prevCounters.map((count, index) => {
          const target = stats[index].end;
          const increment = target / steps;
          return Math.min(Math.round(count + increment), target);
        })
      );

      currentStep++;
    }, stepTime);
  };

  return (
    <StatsContainer ref={sectionRef}>
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatItem key={index}>
            <FontAwesomeIcon icon={stat.icon} className="icon" />
            <div className="number">
              {counters[index]}{stat.suffix}
            </div>
            <div className="label">{stat.label}</div>
          </StatItem>
        ))}
      </StatsGrid>
    </StatsContainer>
  );
}

export default StatsSection; 