import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../../styles/variables';

const ContactContainer = styled.section`
  padding: 80px 6%;
  text-align: center;
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: left;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid ${colors.greyDark};
  border-radius: 5px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${colors.primaryBlue};
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid ${colors.greyDark};
  border-radius: 5px;
  height: 150px;
  resize: vertical;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${colors.primaryBlue};
  }
`;

const SubmitButton = styled.button`
  padding: 12px 30px;
  background: ${colors.primaryOrange};
  color: ${colors.light};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: 0.3s;

  &:hover {
    background: ${colors.primaryBlue};
    transform: translateY(-2px);
  }
`;

const ContactInfo = styled.div`
  text-align: left;
  padding: 20px;
  background: ${colors.grey};
  border-radius: 10px;

  h3 {
    color: ${colors.primaryBlue};
    margin-bottom: 20px;
  }
`;

const ContactDetail = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: ${colors.dark};

  .icon {
    color: ${colors.primaryOrange};
    margin-right: 15px;
    font-size: 20px;
  }
`;

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    alert('Thank you for your message. We will get back to you soon!');
  };

  return (
    <ContactContainer id="contact">
      <SectionTitle>Contact Us</SectionTitle>
      <ContactGrid>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="tel"
            name="phone"
            placeholder="Your Phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <TextArea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
          />
          <SubmitButton type="submit">Send Message</SubmitButton>
        </Form>

        <ContactInfo>
          <h3>Get in Touch</h3>
          <ContactDetail>
            <FontAwesomeIcon icon={faPhone} className="icon" />
            <div>
              <h4>Phone</h4>
              <p>+1 234 567 8900</p>
            </div>
          </ContactDetail>
          <ContactDetail>
            <FontAwesomeIcon icon={faEnvelope} className="icon" />
            <div>
              <h4>Email</h4>
              <p>info@noorelectric.com</p>
            </div>
          </ContactDetail>
          <ContactDetail>
            <FontAwesomeIcon icon={faLocationDot} className="icon" />
            <div>
              <h4>Address</h4>
              <p>123 Solar Street, City, Country</p>
            </div>
          </ContactDetail>
        </ContactInfo>
      </ContactGrid>
    </ContactContainer>
  );
}

export default ContactSection; 