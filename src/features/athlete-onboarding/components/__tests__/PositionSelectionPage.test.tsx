import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PositionSelectionPage from '../PositionSelectionPage';
import { useOnboardingStore } from '../../store/onboardingStore';
import { SPORTS_CONFIG } from '../../data/sportsConfig';
import { POSITIONS_CONFIG } from '../../data/positionsConfig';

// Mock the onboarding store
jest.mock('../../store/onboardingStore');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ sportId: 'cricket' }),
}));

// Mock AthleteOnboardingLayout
jest.mock('../AthleteOnboardingLayout', () => ({
  __esModule: true,
  default: ({ children, title, showBackButton, onBack }: any) => (
    <div data-testid="athlete-onboarding-layout">
      <div data-testid="layout-title">{title}</div>
      {showBackButton && (
        <button data-testid="back-button" onClick={onBack}>
          Back
        </button>
      )}
      {children}
    </div>
  ),
}));

// Mock validation utils
jest.mock('../../utils/validationUtils', () => ({
  validatePositionSelection: jest.fn((position, sport) => {
    if (!sport) {
      return { isValid: false, errors: ['Sport information is missing'] };
    }
    if (!position) {
      return { isValid: false, errors: ['Please select a position to continue'] };
    }
    if (!position.id || !position.name) {
      return { isValid: false, errors: ['Invalid position selection'] };
    }
    return { isValid: true, errors: [] };
  }),
  validateSportSelection: jest.fn((sport) => {
    if (!sport) {
      return { isValid: false, errors: ['Please select a sport to continue'] };
    }
    return { isValid: true, errors: [] };
  }),
  formatValidationErrors: jest.fn((errors) => errors.join(', ')),
  ValidationMessages: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again',
  },
}));

// Mock data configs
jest.mock('../../data/positionsConfig', () => ({
  getPositionsBySportId: jest.fn(),
}));

jest.mock('../../data/sportsConfig', () => ({
  getSportById: jest.fn(),
}));

describe('PositionSelectionPage', () => {
  const mockSport = SPORTS_CONFIG[0]; // Cricket
  const mockPositions = POSITIONS_CONFIG[0].positions; // Cricket positions
  
  const mockStore = {
    selectedSport: mockSport,
    selectedPosition: null,
    setPosition: jest.fn(),
    setError: jest.fn(),
    setSport: jest.fn(),
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOnboardingStore as any).mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PositionSelectionPage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    it('renders the position selection page with correct title', () => {
      renderComponent();
      
      expect(screen.getByTestId('layout-title')).toHaveTextContent('Choose Your Position');
    });

    it('displays selected sport information', () => {
      renderComponent();
      
      expect(screen.getByText(mockSport.name)).toBeInTheDocument();
      expect(screen.getByText(mockSport.icon)).toBeInTheDocument();
    });

    it('renders all positions for the selected sport', () => {
      renderComponent();
      
      mockPositions.forEach(position => {
        expect(screen.getByText(position.name)).toBeInTheDocument();
        expect(screen.getByText(position.description)).toBeInTheDocument();
      });
    });

    it('renders back button', () => {
      renderComponent();
      
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('renders disabled continue button when no position is selected', () => {
      renderComponent();
      
      const continueButton = screen.getByText('Select a position to continue');
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Position Selection Interactions', () => {
    it('selects a position when clicked', () => {
      renderComponent();
      
      const batsmanCard = screen.getByText('Batsman').closest('.position-card');
      expect(batsmanCard).toBeInTheDocument();
      
      fireEvent.click(batsmanCard!);
      
      expect(mockStore.setPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'batsman',
          name: 'Batsman',
        })
      );
    });

    it('handles keyboard navigation for position selection', () => {
      renderComponent();
      
      const bowlerCard = screen.getByText('Bowler').closest('.position-card');
      expect(bowlerCard).toBeInTheDocument();
      
      fireEvent.keyDown(bowlerCard!, { key: 'Enter' });
      
      expect(mockStore.setPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'bowler',
          name: 'Bowler',
        })
      );
    });

    it('handles space key for position selection', () => {
      renderComponent();
      
      const allRounderCard = screen.getByText('All-rounder').closest('.position-card');
      expect(allRounderCard).toBeInTheDocument();
      
      fireEvent.keyDown(allRounderCard!, { key: ' ' });
      
      expect(mockStore.setPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'all-rounder',
          name: 'All-rounder',
        })
      );
    });

    it('shows selected state for chosen position', () => {
      const selectedPosition = mockPositions[0];
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition,
      });
      
      renderComponent();
      
      const selectedCard = screen.getByText(selectedPosition.name).closest('.position-card');
      expect(selectedCard).toHaveClass('selected');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('enables continue button when position is selected', () => {
      const selectedPosition = mockPositions[0];
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition,
      });
      
      renderComponent();
      
      const continueButton = screen.getByText(`Continue as ${selectedPosition.name}`);
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Dynamic Position Options', () => {
    it('loads positions based on sport ID from URL params', () => {
      const { getPositionsBySportId } = require('../../data/positionsConfig');
      
      renderComponent();
      
      expect(getPositionsBySportId).toHaveBeenCalledWith('cricket');
    });

    it('shows different positions for different sports', () => {
      // Mock football positions
      const footballPositions = POSITIONS_CONFIG.find(sp => sp.sportId === 'football')?.positions || [];
      const footballSport = SPORTS_CONFIG.find(sport => sport.id === 'football');
      
      const { getPositionsBySportId } = require('../../data/positionsConfig');
      getPositionsBySportId.mockReturnValue(footballPositions);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: footballSport,
      });
      
      renderComponent();
      
      footballPositions.forEach(position => {
        expect(screen.getByText(position.name)).toBeInTheDocument();
      });
    });

    it('handles sport without positions gracefully', () => {
      const { getPositionsBySportId } = require('../../data/positionsConfig');
      getPositionsBySportId.mockReturnValue([]);
      
      renderComponent();
      
      expect(screen.getByText(`No positions available for ${mockSport.name}`)).toBeInTheDocument();
      expect(screen.getByText('Choose Different Sport')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation error when trying to continue without selection', () => {
      renderComponent();
      
      const continueButton = screen.getByText('Select a position to continue');
      fireEvent.click(continueButton);
      
      expect(screen.getByText('Please select a position to continue')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('validates sport selection on component mount', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: null,
      });
      
      renderComponent();
      
      expect(mockNavigate).toHaveBeenCalledWith('/athlete-onboarding/sport');
    });

    it('loads sport from URL if not in store', () => {
      const { getSportById } = require('../../data/sportsConfig');
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: null,
      });
      
      renderComponent();
      
      expect(getSportById).toHaveBeenCalledWith('cricket');
      expect(mockStore.setSport).toHaveBeenCalled();
    });

    it('handles invalid sport ID from URL', () => {
      const { getSportById } = require('../../data/sportsConfig');
      getSportById.mockReturnValue(undefined);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: null,
      });
      
      renderComponent();
      
      expect(mockStore.setError).toHaveBeenCalledWith('Sport not found. Please select a valid sport.');
      expect(mockNavigate).toHaveBeenCalledWith('/athlete-onboarding/sport');
    });

    it('shows error state when store has error', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        error: 'Network error occurred',
      });
      
      renderComponent();
      
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to specialization page when continue is clicked with valid selection', async () => {
      const selectedPosition = mockPositions[0];
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition,
      });
      
      renderComponent();
      
      const continueButton = screen.getByText(`Continue as ${selectedPosition.name}`);
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `/athlete-onboarding/specialization/${mockSport.id}/${selectedPosition.id}`
        );
      });
    });

    it('navigates back to sport selection when back button is clicked', () => {
      renderComponent();
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/athlete-onboarding/sport');
    });

    it('navigates back to sport selection from no positions message', () => {
      const { getPositionsBySportId } = require('../../data/positionsConfig');
      getPositionsBySportId.mockReturnValue([]);
      
      renderComponent();
      
      const backButton = screen.getByText('Choose Different Sport');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/athlete-onboarding/sport');
    });

    it('handles navigation error gracefully', async () => {
      const selectedPosition = mockPositions[0];
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition,
      });
      
      // Mock navigation to throw error
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      renderComponent();
      
      const continueButton = screen.getByText(`Continue as ${selectedPosition.name}`);
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('Navigation failed');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state when navigating', async () => {
      const selectedPosition = mockPositions[0];
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition,
      });
      
      // Mock a delayed navigation
      mockNavigate.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      
      renderComponent();
      
      const continueButton = screen.getByText(`Continue as ${selectedPosition.name}`);
      fireEvent.click(continueButton);
      
      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(continueButton).toHaveTextContent('Loading...');
      expect(continueButton).toBeDisabled();
    });

    it('shows loading state when sport is not available', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: null,
      });
      
      renderComponent();
      
      expect(screen.getByText('Loading sport information...')).toBeInTheDocument();
    });

    it('disables position cards when loading', () => {
      const selectedPosition = mockPositions[0];
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition,
      });
      
      // Mock a delayed navigation to trigger loading state
      mockNavigate.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      
      renderComponent();
      
      const continueButton = screen.getByText(`Continue as ${selectedPosition.name}`);
      fireEvent.click(continueButton);
      
      // Position cards should be disabled during loading
      const batsmanCard = screen.getByText('Batsman').closest('.position-card');
      expect(batsmanCard).toHaveClass('disabled');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderComponent();
      
      const positionCards = screen.getAllByRole('button');
      positionCards.forEach(card => {
        expect(card).toHaveAttribute('aria-pressed');
        expect(card).toHaveAttribute('aria-label');
      });
    });

    it('has proper tabindex for keyboard navigation', () => {
      renderComponent();
      
      const positionCards = screen.getAllByRole('button');
      positionCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('shows error with proper ARIA attributes', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        error: 'Test error',
      });
      
      renderComponent();
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });
  });
});