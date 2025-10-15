import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import SpecializationPage from '../SpecializationPage';
import { useOnboardingStore } from '../../store/onboardingStore';
import { SPORTS_CONFIG } from '../../data/sportsConfig';
import { POSITIONS_CONFIG } from '../../data/positionsConfig';
import { SPECIALIZATIONS_CONFIG } from '../../data/specializationsConfig';

// Mock the onboarding store
jest.mock('../../store/onboardingStore');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock AthleteOnboardingLayout
jest.mock('../AthleteOnboardingLayout', () => ({
  __esModule: true,
  default: ({ children, onBack, showBackButton }: any) => (
    <div data-testid="athlete-onboarding-layout">
      {showBackButton && (
        <button data-testid="back-button" onClick={onBack}>
          Back
        </button>
      )}
      {children}
    </div>
  ),
}));

// Mock useOnboardingNavigation hook
const mockGoBack = jest.fn();
const mockCompleteOnboarding = jest.fn();
jest.mock('../../hooks/useOnboardingNavigation', () => ({
  useOnboardingNavigation: () => ({
    goBack: mockGoBack,
    completeOnboarding: mockCompleteOnboarding,
  }),
}));

// Mock validation utils
jest.mock('../../utils/validationUtils', () => ({
  validateSpecializationSelection: jest.fn((specializations, requiredCategories) => {
    const missingRequired = requiredCategories.filter(catId => !specializations[catId]);
    if (missingRequired.length > 0) {
      return { 
        isValid: false, 
        errors: missingRequired.map(catId => `Please select your ${catId.replace('_', ' ').toLowerCase()}`)
      };
    }
    return { isValid: true, errors: [] };
  }),
  validateCompleteProfile: jest.fn((sport, position, specializations, requiredCategories) => {
    if (!sport || !position) {
      return { isValid: false, errors: ['Missing sport or position information'] };
    }
    const missingRequired = requiredCategories.filter(catId => !specializations[catId]);
    if (missingRequired.length > 0) {
      return { isValid: false, errors: ['Please complete all required selections'] };
    }
    return { isValid: true, errors: [] };
  }),
  formatValidationErrors: jest.fn((errors) => errors.join(', ')),
  ValidationMessages: {
    SAVE_ERROR: 'Failed to save your profile. Please try again.',
  },
}));

// Mock specializations config
jest.mock('../../data/specializationsConfig', () => ({
  getSpecializationsBySportAndPosition: jest.fn(),
  hasSpecializations: jest.fn(),
}));

describe('SpecializationPage', () => {
  const mockSport = SPORTS_CONFIG[0]; // Cricket
  const mockPosition = POSITIONS_CONFIG[0].positions[0]; // Batsman
  const mockSpecializations = SPECIALIZATIONS_CONFIG[0].categories; // Cricket batsman specializations
  
  const mockStore = {
    selectedSport: mockSport,
    selectedPosition: mockPosition,
    selectedSpecializations: {},
    setSpecialization: jest.fn(),
    setError: jest.fn(),
    error: null,
    isLoading: false,
    saveProfile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOnboardingStore as any).mockReturnValue(mockStore);
    
    // Mock the specializations config to return cricket batsman specializations
    const { getSpecializationsBySportAndPosition, hasSpecializations } = require('../../data/specializationsConfig');
    getSpecializationsBySportAndPosition.mockReturnValue(mockSpecializations);
    hasSpecializations.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SpecializationPage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    it('renders the specialization page with correct title', () => {
      renderComponent();
      
      expect(screen.getByText('Customize Your Profile')).toBeInTheDocument();
      expect(screen.getByText(`Tell us more about your ${mockSport.name} preferences as a ${mockPosition.name}`)).toBeInTheDocument();
    });

    it('renders specialization categories', () => {
      renderComponent();
      
      mockSpecializations.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
        expect(screen.getByText(category.description)).toBeInTheDocument();
      });
    });

    it('renders specialization options for each category', () => {
      renderComponent();
      
      mockSpecializations.forEach(category => {
        category.options.forEach(option => {
          expect(screen.getByText(option.name)).toBeInTheDocument();
          expect(screen.getByText(option.description)).toBeInTheDocument();
        });
      });
    });

    it('shows required indicator for required categories', () => {
      renderComponent();
      
      const requiredCategories = mockSpecializations.filter(cat => cat.required);
      expect(screen.getAllByText('*')).toHaveLength(requiredCategories.length + 1); // +1 for footer text
    });

    it('renders back button', () => {
      renderComponent();
      
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('renders disabled continue button when required selections are missing', () => {
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toHaveClass('disabled');
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Specialization Selection Logic', () => {
    it('selects a specialization option when clicked', () => {
      renderComponent();
      
      const rightHandedOption = screen.getByText('Right-handed');
      fireEvent.click(rightHandedOption);
      
      expect(mockStore.setSpecialization).toHaveBeenCalledWith('batting-hand', 'right-handed');
    });

    it('shows selected state for chosen specialization', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'batting-hand': 'right-handed' },
      });
      
      renderComponent();
      
      const rightHandedOption = screen.getByText('Right-handed').closest('.specialization-option');
      expect(rightHandedOption).toHaveClass('selected');
      expect(screen.getByText('Right-handed').closest('.specialization-option')).toContainElement(
        screen.getByRole('img', { hidden: true }) // Check icon
      );
    });

    it('enables continue button when all required selections are made', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'batting-hand': 'right-handed' },
      });
      
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      expect(continueButton).not.toHaveClass('disabled');
      expect(continueButton).not.toBeDisabled();
    });

    it('allows multiple specializations to be selected in different categories', () => {
      // Mock cricket all-rounder which has multiple categories
      const allRounderPosition = POSITIONS_CONFIG[0].positions[2]; // All-rounder
      const allRounderSpecializations = SPECIALIZATIONS_CONFIG.find(
        sp => sp.sportId === 'cricket' && sp.positionId === 'all-rounder'
      )?.categories || [];
      
      const { getSpecializationsBySportAndPosition } = require('../../data/specializationsConfig');
      getSpecializationsBySportAndPosition.mockReturnValue(allRounderSpecializations);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedPosition: allRounderPosition,
      });
      
      renderComponent();
      
      // Select batting hand
      const rightHandedOption = screen.getByText('Right-handed');
      fireEvent.click(rightHandedOption);
      
      // Select bowling style
      const fastBowlingOption = screen.getByText('Fast Bowling');
      fireEvent.click(fastBowlingOption);
      
      expect(mockStore.setSpecialization).toHaveBeenCalledWith('batting-hand', 'right-handed');
      expect(mockStore.setSpecialization).toHaveBeenCalledWith('bowling-style', 'fast-bowling');
    });
  });

  describe('Conditional Rendering', () => {
    it('renders different specializations based on sport and position', () => {
      // Mock football goalkeeper specializations
      const footballSport = SPORTS_CONFIG.find(sport => sport.id === 'football');
      const goalkeeperPosition = POSITIONS_CONFIG.find(sp => sp.sportId === 'football')?.positions[0];
      const goalkeeperSpecializations = SPECIALIZATIONS_CONFIG.find(
        sp => sp.sportId === 'football' && sp.positionId === 'goalkeeper'
      )?.categories || [];
      
      const { getSpecializationsBySportAndPosition } = require('../../data/specializationsConfig');
      getSpecializationsBySportAndPosition.mockReturnValue(goalkeeperSpecializations);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: footballSport,
        selectedPosition: goalkeeperPosition,
      });
      
      renderComponent();
      
      expect(screen.getByText('Goalkeeper Style')).toBeInTheDocument();
      expect(screen.getByText('Shot-stopping Specialist')).toBeInTheDocument();
      expect(screen.getByText('Sweeper Keeper')).toBeInTheDocument();
    });

    it('completes onboarding immediately when no specializations are available', () => {
      const { hasSpecializations } = require('../../data/specializationsConfig');
      hasSpecializations.mockReturnValue(false);
      
      renderComponent();
      
      expect(mockCompleteOnboarding).toHaveBeenCalled();
    });

    it('shows skip button when there are optional categories', () => {
      // Mock tennis singles with optional categories
      const tennisSpecializations = SPECIALIZATIONS_CONFIG.find(
        sp => sp.sportId === 'tennis' && sp.positionId === 'singles-specialist'
      )?.categories || [];
      
      const { getSpecializationsBySportAndPosition } = require('../../data/specializationsConfig');
      getSpecializationsBySportAndPosition.mockReturnValue(tennisSpecializations);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'playing-hand': 'right-handed' }, // Required selection made
      });
      
      renderComponent();
      
      expect(screen.getByText('Skip Optional')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation error when trying to continue without required selections', () => {
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      fireEvent.click(continueButton);
      
      expect(screen.getByText('Please select your batting hand')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('redirects to sport selection when sport or position is missing', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSport: null,
        selectedPosition: null,
      });
      
      renderComponent();
      
      expect(mockNavigate).toHaveBeenCalledWith('/athlete-onboarding/sport');
    });

    it('shows error state when store has error', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        error: 'Save error occurred',
      });
      
      renderComponent();
      
      expect(screen.getByText('Save error occurred')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('validates complete profile before saving', async () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'batting-hand': 'right-handed' },
      });
      
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      fireEvent.click(continueButton);
      
      const { validateCompleteProfile } = require('../../utils/validationUtils');
      expect(validateCompleteProfile).toHaveBeenCalledWith(
        mockSport,
        mockPosition,
        { 'batting-hand': 'right-handed' },
        ['batting-hand']
      );
    });
  });

  describe('Navigation and Completion', () => {
    it('calls saveProfile and completes onboarding when continue is clicked', async () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'batting-hand': 'right-handed' },
      });
      
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(mockStore.saveProfile).toHaveBeenCalled();
        expect(mockCompleteOnboarding).toHaveBeenCalled();
      });
    });

    it('handles skip functionality for optional specializations', async () => {
      // Mock tennis singles with optional categories
      const tennisSpecializations = SPECIALIZATIONS_CONFIG.find(
        sp => sp.sportId === 'tennis' && sp.positionId === 'singles-specialist'
      )?.categories || [];
      
      const { getSpecializationsBySportAndPosition } = require('../../data/specializationsConfig');
      getSpecializationsBySportAndPosition.mockReturnValue(tennisSpecializations);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'playing-hand': 'right-handed' }, // Required selection made
      });
      
      renderComponent();
      
      const skipButton = screen.getByText('Skip Optional');
      fireEvent.click(skipButton);
      
      await waitFor(() => {
        expect(mockStore.saveProfile).toHaveBeenCalled();
        expect(mockCompleteOnboarding).toHaveBeenCalled();
      });
    });

    it('navigates back when back button is clicked', () => {
      renderComponent();
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('handles save profile error gracefully', async () => {
      const saveError = new Error('Save failed');
      mockStore.saveProfile.mockRejectedValue(saveError);
      
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'batting-hand': 'right-handed' },
      });
      
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state when saving profile', async () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        selectedSpecializations: { 'batting-hand': 'right-handed' },
        isLoading: true,
      });
      
      renderComponent();
      
      const continueButton = screen.getByText('Saving...');
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toBeDisabled();
      expect(continueButton).toHaveClass('loading-state');
    });

    it('shows loading state when page is initializing', () => {
      // Mock the useEffect to show loading state
      const { getSpecializationsBySportAndPosition } = require('../../data/specializationsConfig');
      getSpecializationsBySportAndPosition.mockImplementation(() => {
        // Simulate async loading
        return [];
      });
      
      renderComponent();
      
      // The component should show loading initially
      expect(screen.getByText('Loading specializations...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error display', () => {
      (useOnboardingStore as any).mockReturnValue({
        ...mockStore,
        error: 'Test error',
      });
      
      renderComponent();
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });

    it('has proper button states and attributes', () => {
      renderComponent();
      
      const continueButton = screen.getByText('Complete Setup');
      expect(continueButton).toHaveAttribute('disabled');
      
      const specializationOptions = screen.getAllByRole('button').filter(
        button => button.classList.contains('specialization-option')
      );
      
      specializationOptions.forEach(option => {
        expect(option).not.toHaveAttribute('disabled');
      });
    });

    it('provides proper feedback for required fields', () => {
      renderComponent();
      
      expect(screen.getByText('* Required fields')).toBeInTheDocument();
      
      const requiredCategories = mockSpecializations.filter(cat => cat.required);
      requiredCategories.forEach(category => {
        const categoryElement = screen.getByText(category.name);
        expect(categoryElement.parentElement).toContainElement(screen.getByText('*'));
      });
    });
  });
});