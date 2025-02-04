import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSolarPanel, faBatteryFull, faTools } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const ServicesContainer = styled.section`
  padding: 80px 6%;
  text-align: center;
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 40px;
`;

const ServiceCard = styled.div`
  padding: 30px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: 0.3s;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }

  .icon {
    font-size: 40px;
    color: ${colors.primaryOrange};
    margin-bottom: 20px;
  }

  h3 {
    margin-bottom: 15px;
    color: ${colors.dark};
  }

  p {
    color: #666;
  }
`;

const services = [
  {
    icon: faSolarPanel,
    title: "Solar Installation",
    description: "Professional installation of solar panels for residential and commercial properties."
  },
  {
    icon: faBatteryFull,
    title: "Energy Storage",
    description: "Advanced battery solutions for reliable power storage."
  },
  {
    icon: faTools,
    title: "Maintenance",
    description: "Regular maintenance and repair services for solar systems."
  }
];

function ServicesSection() {
  return (
    <ServicesContainer id="services">
      <SectionTitle>Our Services</SectionTitle>
      <ServicesGrid>
        {services.map((service, index) => (
          <ServiceCard key={index}>
            <FontAwesomeIcon icon={service.icon} className="icon" />
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
}

export default ServicesSection;