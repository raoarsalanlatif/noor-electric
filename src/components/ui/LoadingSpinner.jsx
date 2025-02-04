import styled, { keyframes } from 'styled-components';
import { colors } from '../../styles/variables';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid ${colors.grey};
  border-top: 5px solid ${colors.primaryBlue};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

function LoadingSpinner() {
  return (
    <SpinnerWrapper>
      <Spinner />
    </SpinnerWrapper>
  );
}

export default LoadingSpinner; 