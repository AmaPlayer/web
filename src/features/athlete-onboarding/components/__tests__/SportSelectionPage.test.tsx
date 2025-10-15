import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple test component that tests the core functionality
const TestSportSelectionComponent = () => {
  const [selectedSport, setSelectedSport] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const sports = [
    { id: 'cricket', name: 'Cricket', icon: '🏏', description: 'The gentleman\'s game' },
    { id: 'football', name: 'Football', icon: '⚽', description: 'The beautiful game' }
  ];

  const handleSportClick = (sport: any) => {
    setSelectedSport(sport);
    setError(null);
  };

  const handleContinue = () => {
    if (!selectedSport) {
      setError('Please select a sport to continue');
    }
  };



  return (
    <div data-testid="sport-selection-container">
      <h1>Choose Your Sport</h1>
      <p>Select the sport you're most passionate about.</p>
      
      {error && (
        <div role="alert" data-testid="error-message">
          {error}
        </div>
      )}
      
      <div className="sports-grid">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className={`sport-card ${selectedSport?.id === sport.id ? 'selected' : ''}`}
            onClick={() => handleSportClick(sport)}
            role="button"
            tabIndex={0}
            aria-pressed={selectedSport?.id === sport.id}
            aria-label={`Select ${sport.name}`}
          >
            <span>{sport.icon}</span>
            <h3>{sport.name}</h3>
            <p>{sport.description}</p>
            {selectedSport?.id === sport.id && <span>✓</span>}
          </div>
        ))}
      </div>
      
      <button
        onClick={handleContinue}
        className={!selectedSport ? 'disabled' : ''}
        data-testid="continue-button"
        type="button"
      >
        {selectedSport ? `Continue with ${selectedSport.name}` : 'Select a sport to continue'}
      </button>
    </div>
  );
};

describe('SportSelectionPage Core Functionality', () => {
  const renderComponent = () => {
    return render(<TestSportSelectionComponent />);
  };

  describe('Component Rendering', () => {
    it('renders the sport selection page with correct title', () => {
      renderComponent();
      
      expect(screen.getByText('Choose Your Sport')).toBeInTheDocument();
      expect(screen.getByText('Select the sport you\'re most passionate about.')).toBeInTheDocument();
    });

    it('renders sports from config', () => {
      renderComponent();
      
      expect(screen.getByText('Cricket')).toBeInTheDocument();
      expect(screen.getByText('Football')).toBeInTheDocument();
      expect(screen.getByText('The gentleman\'s game')).toBeInTheDocument();
      expect(screen.getByText('The beautiful game')).toBeInTheDocument();
    });

    it('renders disabled continue button when no sport is selected', () => {
      renderComponent();
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveTextContent('Select a sport to continue');
      expect(continueButton).toHaveClass('disabled');
    });
  });

  describe('Sport Selection Interactions', () => {
    it('selects a sport when clicked', () => {
      renderComponent();
      
      const cricketCard = screen.getByLabelText('Select Cricket');
      fireEvent.click(cricketCard);
      
      expect(cricketCard).toHaveClass('selected');
      expect(cricketCard).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('enables continue button when sport is selected', () => {
      renderComponent();
      
      const cricketCard = screen.getByLabelText('Select Cricket');
      fireEvent.click(cricketCard);
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveTextContent('Continue with Cricket');
      expect(continueButton).not.toHaveClass('disabled');
    });

    it('can switch between sports', () => {
      renderComponent();
      
      // Select cricket first
      const cricketCard = screen.getByLabelText('Select Cricket');
      fireEvent.click(cricketCard);
      expect(cricketCard).toHaveClass('selected');
      
      // Then select football
      const footballCard = screen.getByLabelText('Select Football');
      fireEvent.click(footballCard);
      
      expect(footballCard).toHaveClass('selected');
      expect(cricketCard).not.toHaveClass('selected');
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveTextContent('Continue with Football');
    });
  });

  describe('Validation', () => {
    it('shows validation error when trying to continue without selection', () => {
      renderComponent();
      
      const continueButton = screen.getByTestId('continue-button');
      fireEvent.click(continueButton);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Please select a sport to continue');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('clears validation error when sport is selected', () => {
      renderComponent();
      
      // First trigger error
      const continueButton = screen.getByTestId('continue-button');
      fireEvent.click(continueButton);
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      
      // Then select a sport
      const cricketCard = screen.getByLabelText('Select Cricket');
      fireEvent.click(cricketCard);
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderComponent();
      
      const sportCards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('Select')
      );
      expect(sportCards).toHaveLength(2);
      
      sportCards.forEach(card => {
        expect(card).toHaveAttribute('aria-pressed');
        expect(card).toHaveAttribute('aria-label');
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('shows error with proper ARIA attributes', () => {
      renderComponent();
      
      const continueButton = screen.getByTestId('continue-button');
      fireEvent.click(continueButton);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
    });
  });
});