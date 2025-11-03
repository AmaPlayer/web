import React, { useState, useEffect, useRef } from 'react';
import { LocationSuggestion } from '@features/events/types/event.types';
import { locationService } from '@features/events/services/locationService';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (location: LocationSuggestion) => void;
  placeholder?: string;
  error?: string;
}

/**
 * LocationInput component with graceful degradation for autocomplete failures
 * Requirements: 8.1, 8.2, 8.3, 8.4, 10.4
 */
export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter location',
  error
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [autocompleteDisabled, setAutocompleteDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Skip if autocomplete is disabled due to repeated failures
      if (autocompleteDisabled) {
        return;
      }

      if (value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setAutocompleteError(null);
        return;
      }

      setIsLoading(true);
      setAutocompleteError(null);
      
      try {
        const results = await locationService.searchLocations(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error('Failed to fetch location suggestions:', err);
        
        // Graceful degradation: Allow manual input even if autocomplete fails
        setSuggestions([]);
        setShowSuggestions(false);
        
        // Show a subtle error but don't block the user
        if (err instanceof Error) {
          if (err.message.includes('timeout') || err.message.includes('Network')) {
            setAutocompleteError('Location suggestions unavailable. You can still enter location manually.');
            // Disable autocomplete temporarily to avoid repeated failures
            setAutocompleteDisabled(true);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value, autocompleteDisabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow click events on suggestions to fire
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="location-input-container">
      <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`location-input ${error ? 'location-input-error' : ''}`}
          aria-label="Location"
          aria-autocomplete={autocompleteDisabled ? 'none' : 'list'}
          aria-controls={!autocompleteDisabled ? 'location-suggestions' : undefined}
          aria-expanded={showSuggestions}
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
        />
        
        {isLoading && (
          <span className="location-loading" aria-label="Loading suggestions">
            ⏳
          </span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="location-suggestions"
          className="location-suggestions"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`location-suggestion ${
                index === selectedIndex ? 'location-suggestion-selected' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="suggestion-name">{suggestion.name}</div>
              <div className="suggestion-address">{suggestion.address}</div>
            </div>
          ))}
        </div>
      )}

      {/* Show autocomplete error as a warning, not blocking */}
      {autocompleteError && !error && (
        <div className="location-input-warning" role="status" aria-live="polite">
          {autocompleteError}
        </div>
      )}

      {/* Show validation error with higher priority */}
      {error && (
        <div className="location-input-error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </div>
  );
};
