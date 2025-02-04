import { useState } from 'react';
import styled from 'styled-components';
import { colors } from '../../styles/variables';

const CalculatorContainer = styled.section`
  padding: 80px 6%;
  background: ${colors.grey};
`;

const CalculatorWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: ${colors.light};
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    color: ${colors.dark};
  }

  input[type="range"] {
    width: 100%;
    margin: 10px 0;
  }

  .value-display {
    display: flex;
    justify-content: space-between;
    color: ${colors.primaryBlue};
  }
`;

const Results = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: ${colors.primaryBlue}10;
  border-radius: 8px;

  h3 {
    color: ${colors.primaryBlue};
    margin-bottom: 15px;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    padding: 10px 0;
    border-bottom: 1px solid ${colors.grey};
  }

  .highlight {
    color: ${colors.primaryOrange};
    font-weight: bold;
  }
`;

function SavingsCalculator() {
  const [monthlyBill, setMonthlyBill] = useState(200);
  const [sunlightHours, setSunlightHours] = useState(5);
  const [electricityRate, setElectricityRate] = useState(0.12);

  const calculateSavings = () => {
    const annualConsumption = (monthlyBill / electricityRate) * 12;
    const potentialSolarProduction = sunlightHours * 365 * 0.75; // 75% efficiency
    const annualSavings = monthlyBill * 12;
    const twentyYearSavings = annualSavings * 20;
    const systemSize = (annualConsumption / potentialSolarProduction).toFixed(2);

    return {
      annualSavings: annualSavings.toFixed(2),
      twentyYearSavings: twentyYearSavings.toFixed(2),
      systemSize,
      co2Reduction: (annualConsumption * 0.85).toFixed(2) // kg of CO2
    };
  };

  const savings = calculateSavings();

  return (
    <CalculatorContainer id="calculator">
      <SectionTitle>Solar Savings Calculator</SectionTitle>
      <CalculatorWrapper>
        <InputGroup>
          <label>Monthly Electricity Bill ($)</label>
          <input
            type="range"
            min="50"
            max="1000"
            value={monthlyBill}
            onChange={(e) => setMonthlyBill(Number(e.target.value))}
          />
          <div className="value-display">
            <span>$50</span>
            <span>${monthlyBill}</span>
            <span>$1000</span>
          </div>
        </InputGroup>

        <InputGroup>
          <label>Average Daily Sunlight Hours</label>
          <input
            type="range"
            min="3"
            max="8"
            step="0.5"
            value={sunlightHours}
            onChange={(e) => setSunlightHours(Number(e.target.value))}
          />
          <div className="value-display">
            <span>3h</span>
            <span>{sunlightHours}h</span>
            <span>8h</span>
          </div>
        </InputGroup>

        <Results>
          <h3>Your Potential Savings</h3>
          <div className="result-item">
            <span>Annual Savings:</span>
            <span className="highlight">${savings.annualSavings}</span>
          </div>
          <div className="result-item">
            <span>20-Year Savings:</span>
            <span className="highlight">${savings.twentyYearSavings}</span>
          </div>
          <div className="result-item">
            <span>Recommended System Size:</span>
            <span className="highlight">{savings.systemSize} kW</span>
          </div>
          <div className="result-item">
            <span>Annual CO2 Reduction:</span>
            <span className="highlight">{savings.co2Reduction} kg</span>
          </div>
        </Results>
      </CalculatorWrapper>
    </CalculatorContainer>
  );
}

export default SavingsCalculator; 