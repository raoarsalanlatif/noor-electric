import styled from 'styled-components';
import { colors } from '../../styles/variables';

const ProjectsContainer = styled.section`
  padding: 80px 6%;
  background: #f5f5f5;
  text-align: center;
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
`;

const ProjectCard = styled.div`
  background: ${colors.light};
  border-radius: 10px;
  overflow: hidden;
  transition: 0.3s;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  h3 {
    padding: 15px;
    color: ${colors.dark};
  }

  p {
    padding: 0 15px 15px;
    color: #666;
  }
`;

const projects = [
  {
    image: "https://via.placeholder.com/300x200",
    title: "Residential Solar",
    description: "5kW system installation in downtown area"
  },
  {
    image: "https://via.placeholder.com/300x200",
    title: "Commercial Project",
    description: "20kW system for local business"
  },
  {
    image: "https://via.placeholder.com/300x200",
    title: "Industrial Solution",
    description: "50kW system with storage solution"
  }
];

function ProjectsSection() {
  return (
    <ProjectsContainer id="projects">
      <SectionTitle>Recent Projects</SectionTitle>
      <ProjectGrid>
        {projects.map((project, index) => (
          <ProjectCard key={index}>
            <img src={project.image} alt={project.title} />
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </ProjectCard>
        ))}
      </ProjectGrid>
    </ProjectsContainer>
  );
}

export default ProjectsSection;