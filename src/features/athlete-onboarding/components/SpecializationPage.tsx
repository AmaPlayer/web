import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Check, AlertCircle } from 'lucide-react';
import AthleteOnboardingLayout from './AthleteOnboardingLayout';
import { useOnboardingStore } from '../store/onboardingStore';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getSpecializationsBySportAndPosition, 
  hasSpecializations,
  SpecializationCategory 
} from '../data/specializationsConfig';
import { SPORTS_CONFIG } from '../data/sportsConfig';
import { getPositionsBySportId } from '../data/positionsConfig';
import { 
  validateSpecializationSelection, 
  validateCompleteProfile,
  ValidationMessages,
  formatValidationErrors 
} from '../utils/validationUtils';
import '../styles/SpecializationPage.css';

const SpecializationPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { sportId, positionId } = useParams<{ sportId?: string; positionId?: string }>();
  const { 
    selectedSports, 
    selectedPosition, 
    selectedSpecializations,
    setSpecialization,
    setSports,
    setPosition,
    setError,
    error,
    isLoading,
    saveProfile
  } = useOnboardingStore();
  
  const { 
    goBack, 
    completeOnboarding 
  } = useOnboardingNavigation();

  const [categories, setCategories] = useState<SpecializationCategory[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    let currentSport = selectedSports.find(s => s.id === sportId) || selectedSports[0];
    let currentPosition = selectedPosition;

    // If URL parameters are provided, try to load sport and position from them
    if (sportId && positionId) {
      // Find sport from config
      const sport = SPORTS_CONFIG.find(s => s.id === sportId);
      if (sport && !selectedSports.some(s => s.id === sport.id)) {
        setSports([...selectedSports, sport]);
        currentSport = sport;
      }

      // Find position from config
      if (currentSport) {
        const positions = getPositionsBySportId(currentSport.id);
        const position = positions.find(p => p.id === positionId);
        if (position && !selectedPosition) {
          setPosition(position);
          currentPosition = position;
        }
      }
    }

    // Redirect if sport or position still not available
    if (!currentSport || !currentPosition) {
      navigate('/athlete-onboarding/sport');
      return;
    }

    // Load specializations for the selected sport and position
    const specializationCategories = getSpecializationsBySportAndPosition(
      currentSport.id, 
      currentPosition.id
    );

    setCategories(specializationCategories);
    setPageLoading(false);

    // If no specializations available, save profile and go to login immediately
    if (!hasSpecializations(currentSport.id, currentPosition.id)) {
      if (!currentUser?.uid) {
        setError('Please log in to save your profile.');
        navigate('/login');
        return;
      }
      
      saveProfile(currentUser.uid).then(() => {
        navigate('/login');
      }).catch((error) => {
        console.error('Failed to save profile:', error);
        setError('Failed to save profile. Please try again.');
      });
    }
  }, [selectedSports, selectedPosition, sportId, positionId, navigate, setSports, setPosition, saveProfile, setError, currentUser]);

  const handleSpecializationSelect = (categoryId: string, optionId: string) => {
    setHasUserInteracted(true);
    
    // Update the specialization
    setSpecialization(categoryId, optionId);
    
    // Validate current specializations after update
    const updatedSpecializations = {
      ...selectedSpecializations,
      [categoryId]: optionId
    };
    
    const requiredCategories = categories
      .filter(cat => cat.required)
      .map(cat => cat.id);
    
    const validation = validateSpecializationSelection(updatedSpecializations, requiredCategories);
    
    if (validation.isValid) {
      setValidationErrors([]);
      setError(null);
    } else {
      // Only show errors if user has interacted and we're missing required fields
      const missingRequired = requiredCategories.filter(
        catId => !updatedSpecializations[catId]
      );
      if (missingRequired.length > 0) {
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors([]);
        setError(null);
      }
    }
    
    setJustSelected(`${categoryId}-${optionId}`);
    
    // Clear the selection animation after a delay
    setTimeout(() => {
      setJustSelected(null);
    }, 400);
  };

  const handleContinue = async () => {
    setHasUserInteracted(true);
    
    // Check if user is authenticated
    if (!currentUser?.uid) {
      setError('Please log in to save your profile.');
      navigate('/login');
      return;
    }
    
    // Validate required specializations
    const requiredCategories = categories
      .filter(cat => cat.required)
      .map(cat => cat.id);
    
    const specializationValidation = validateSpecializationSelection(
      selectedSpecializations, 
      requiredCategories
    );

    if (!specializationValidation.isValid) {
      setValidationErrors(specializationValidation.errors);
      setError(formatValidationErrors(specializationValidation.errors));
      return;
    }

    // Validate complete profile
    const currentSport = selectedSports.find(s => s.id === sportId) || selectedSports[0];
    const profileValidation = validateCompleteProfile(
      currentSport,
      selectedPosition,
      selectedSpecializations,
      requiredCategories
    );

    if (!profileValidation.isValid) {
      setValidationErrors(profileValidation.errors);
      setError(formatValidationErrors(profileValidation.errors));
      return;
    }

    try {
      // Clear validation errors before saving
      setValidationErrors([]);
      setError(null);
      
      // Save the athlete profile
      await saveProfile(currentUser.uid);
      
      // Navigate directly to login after completing onboarding
      navigate('/login');
    } catch (error) {
      // Error is already handled in the store, but add validation context
      console.error('Failed to complete onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : ValidationMessages.SAVE_ERROR;
      setValidationErrors([errorMessage]);
    }
  };

  const handleSkip = async () => {
    setHasUserInteracted(true);
    
    // Check if user is authenticated
    if (!currentUser?.uid) {
      setError('Please log in to save your profile.');
      navigate('/login');
      return;
    }
    
    // Validate that required specializations are completed
    const requiredCategories = categories
      .filter(cat => cat.required)
      .map(cat => cat.id);
    
    const specializationValidation = validateSpecializationSelection(
      selectedSpecializations, 
      requiredCategories
    );

    if (!specializationValidation.isValid) {
      setValidationErrors(specializationValidation.errors);
      setError('Please complete the required selections before continuing');
      return;
    }

    try {
      // Clear validation errors before saving
      setValidationErrors([]);
      setError(null);
      
      // Save the athlete profile
      await saveProfile(currentUser.uid);
      
      // Navigate directly to login after completing onboarding
      navigate('/login');
    } catch (error) {
      // Error is already handled in the store
      console.error('Failed to complete onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : ValidationMessages.SAVE_ERROR;
      setValidationErrors([errorMessage]);
    }
  };

  const isOptionSelected = (categoryId: string, optionId: string): boolean => {
    return selectedSpecializations[categoryId] === optionId;
  };

  const canContinue = (): boolean => {
    const requiredCategories = categories.filter(cat => cat.required);
    return requiredCategories.every(cat => selectedSpecializations[cat.id]);
  };

  const hasOptionalCategories = (): boolean => {
    return categories.some(cat => !cat.required);
  };

  if (pageLoading) {
    return (
      <AthleteOnboardingLayout
        onBack={goBack}
        showBackButton={true}
      >
        <div className="specialization-loading">
          <div className="loading-spinner"></div>
          <p>Loading specializations...</p>
        </div>
      </AthleteOnboardingLayout>
    );
  }

  const currentSport = selectedSports.find(s => s.id === sportId) || selectedSports[0];
  
  if (!currentSport || !selectedPosition) {
    return null;
  }

  return (
    <AthleteOnboardingLayout
      onBack={goBack}
      showBackButton={true}
    >
      <div className="specialization-page">
        <div className="specialization-header">
          <h1>Customize Your Profile</h1>
          <p>
            Tell us more about your {currentSport.name} preferences as a {selectedPosition.name}
          </p>
        </div>

        {/* Validation Error Display */}
        {(error || validationErrors.length > 0) && hasUserInteracted && (
          <div className="validation-error-container" role="alert" aria-live="polite">
            <div className="validation-error">
              <AlertCircle size={20} className="error-icon" />
              <div className="error-content">
                <span className="error-message">
                  {error || formatValidationErrors(validationErrors)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="specialization-content">
          {categories.map((category) => (
            <div key={category.id} className="specialization-category">
              <div className="category-header">
                <h3>
                  {category.name}
                  {category.required && <span className="required-indicator">*</span>}
                </h3>
                <p>{category.description}</p>
              </div>

              <div className="specialization-options">
                {category.options.map((option) => (
                  <button
                    key={option.id}
                    className={`specialization-option ${
                      isOptionSelected(category.id, option.id) ? 'selected' : ''
                    } ${justSelected === `${category.id}-${option.id}` ? 'success-state' : ''}`}
                    onClick={() => handleSpecializationSelect(category.id, option.id)}
                  >
                    <div className="option-content">
                      <div className="option-header">
                        <h4>{option.name}</h4>
                        {isOptionSelected(category.id, option.id) && (
                          <Check className="check-icon" size={20} />
                        )}
                      </div>
                      <p>{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="specialization-actions">
          {hasOptionalCategories() && canContinue() && (
            <button 
              className="skip-button"
              onClick={handleSkip}
            >
              Skip Optional
            </button>
          )}
          
          <button 
            className={`continue-button ${canContinue() && !isLoading && validationErrors.length === 0 ? 'enabled' : 'disabled'} ${isLoading ? 'loading-state' : ''} ${validationErrors.length > 0 ? 'error-state' : ''}`}
            onClick={handleContinue}
            disabled={!canContinue() || isLoading || validationErrors.length > 0}
            aria-describedby={validationErrors.length > 0 ? "specialization-validation-error" : undefined}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                Saving...
              </>
            ) : (
              <>
                Complete Setup
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>

        <div className="specialization-footer">
          <p>
            <span className="required-indicator">*</span> Required fields
          </p>
        </div>
      </div>
    </AthleteOnboardingLayout>
  );
};
export
 default SpecializationPage;