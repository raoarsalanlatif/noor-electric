import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const GalleryContainer = styled.section`
  padding: 80px 6%;
  background: ${colors.light};
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
  text-align: center;
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const GalleryItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  border-radius: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: 0.3s;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90%;
  max-height: 90vh;

  img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: ${colors.light};
  font-size: 24px;
  cursor: pointer;
`;

// Replace these with your actual project images
const galleryImages = [
  {
    id: 1,
    src: 'https://voyagevite.s3.eu-north-1.amazonaws.com/99f964c1-d65e-48e7-8f7d-024b72c6ec11.jpg',
    alt: 'Solar Installation 1'
  },
  {
    id: 2,
    src: 'https://voyagevite.s3.eu-north-1.amazonaws.com/99f964c1-d65e-48e7-8f7d-024b72c6ec11.jpg',
    alt: 'Solar Installation 2'
  },
  {
    id: 3,
    src: 'https://voyagevite.s3.eu-north-1.amazonaws.com/99f964c1-d65e-48e7-8f7d-024b72c6ec11.jpg',
    alt: 'Solar Installation 3'
  },
  {
    id: 4,
    src: 'https://voyagevite.s3.eu-north-1.amazonaws.com/99f964c1-d65e-48e7-8f7d-024b72c6ec11.jpg',
    alt: 'Solar Installation 4'
  },
  {
    id: 5,
    src: 'https://voyagevite.s3.eu-north-1.amazonaws.com/99f964c1-d65e-48e7-8f7d-024b72c6ec11.jpg',
    alt: 'Solar Installation 5'
  },
  {
    id: 6,
    src: 'https://voyagevite.s3.eu-north-1.amazonaws.com/99f964c1-d65e-48e7-8f7d-024b72c6ec11.jpg',
    alt: 'Solar Installation 6'
  }
];

function GallerySection() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <GalleryContainer id="gallery">
      <SectionTitle>Our Work Gallery</SectionTitle>
      <GalleryGrid>
        {galleryImages.map((image) => (
          <GalleryItem 
            key={image.id}
            onClick={() => setSelectedImage(image)}
          >
            <img src={image.src} alt={image.alt} />
          </GalleryItem>
        ))}
      </GalleryGrid>

      {selectedImage && (
        <Modal onClick={() => setSelectedImage(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedImage(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </CloseButton>
            <img src={selectedImage.src} alt={selectedImage.alt} />
          </ModalContent>
        </Modal>
      )}
    </GalleryContainer>
  );
}

export default GallerySection; 