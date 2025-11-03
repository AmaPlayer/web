/**
 * Component Tests for LanguageSelector
 * 
 * Tests that all languages are rendered, current language is highlighted,
 * language change on selection, keyboard navigation, and accessibility.
 * 
 * Requirements tested: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '../LanguageSelector';
import { UnifiedPreferencesProvider } from '../../../contexts/UnifiedPreferencesContext';

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: null }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock theme optimization
jest.mock('../../../utils/theme/themeOptimization', () => ({
  applyThemeToDOM: jest.fn()
}));

// Mock translations
jest.mock('../../../translations', () => ({
  languages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
  ],
  getTranslation: (lang: string, key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: { 
        selectLanguage: 'Select Language',
        chooseLanguage: 'Choose Language',
        availableLanguages: 'Available languages'
      },
      hi: { 
        selectLanguage: 'भाषा चुनें',
        chooseLanguage: 'भाषा चुनें',
        availableLanguages: 'उपलब्ध भाषाएँ'
      }
    };
    return translations[lang]?.[key] || key;
  }
}));

describe('LanguageSelector Component', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <UnifiedPreferencesProvider>
        {component}
      </UnifiedPreferencesProvider>
    );
  };

  describe('Rendering - All Languages', () => {
    it('should render all 12 supported languages in dropdown variant', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      // Open dropdown
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check all languages are present
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(12);
      
      const languageNames = options.map(opt => opt.textContent);
      expect(languageNames.some(name => name?.includes('English'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Hindi'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Punjabi'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Marathi'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Bengali'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Tamil'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Telugu'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Kannada'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Malayalam'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Gujarati'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Odia'))).toBe(true);
      expect(languageNames.some(name => name?.includes('Assamese'))).toBe(true);
    });

    it('should render all languages with native names when showNativeNames is true', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" showNativeNames={true} />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check native names are displayed
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(opt => opt.textContent);
      expect(optionTexts.some(text => text?.includes('हिन्दी'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('ਪੰਜਾਬੀ'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('मराठी'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('বাংলা'))).toBe(true);
    });

    it('should render all languages in inline variant', () => {
      renderWithProvider(<LanguageSelector variant="inline" />);
      
      // In inline variant, all languages should be visible immediately
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(12);
      
      const buttonTexts = buttons.map(btn => btn.textContent);
      expect(buttonTexts.some(text => text?.includes('English'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('Hindi'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('Punjabi'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('Tamil'))).toBe(true);
    });

    it('should render all languages in modal variant', async () => {
      renderWithProvider(<LanguageSelector variant="modal" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check languages in modal
      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map(btn => btn.textContent);
      expect(buttonTexts.some(text => text?.includes('English'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('Hindi'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('Telugu'))).toBe(true);
    });
  });

  describe('Current Language Highlighting', () => {
    it('should highlight the currently selected language in dropdown', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Find the English option (default language)
      const options = screen.getAllByRole('option');
      const englishOption = options.find(opt => opt.textContent?.includes('English'));
      
      expect(englishOption).toHaveClass('language-selector__option--active');
      expect(englishOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should show checkmark for currently selected language', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check for checkmark (✓) next to selected language
      const checkmarks = screen.getAllByLabelText('Selected');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should display current language name in toggle button', () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      expect(toggleButton).toHaveTextContent('English');
    });

    it('should update highlighted language after selection', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      // Open dropdown
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Select Hindi
      const hindiOption = screen.getAllByRole('option').find(opt => 
        opt.textContent?.includes('Hindi')
      );
      fireEvent.click(hindiOption!);

      // Reopen dropdown
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
      
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check Hindi is now highlighted
      const options = screen.getAllByRole('option');
      const newHindiOption = options.find(opt => opt.textContent?.includes('Hindi'));
      expect(newHindiOption).toHaveClass('language-selector__option--active');
    });
  });

  describe('Language Change on Selection', () => {
    it('should change language when an option is clicked', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Click on Hindi option
      const hindiOption = screen.getAllByRole('option').find(opt => 
        opt.textContent?.includes('Hindi')
      );
      fireEvent.click(hindiOption!);

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      // Toggle button should show new language
      expect(toggleButton).toHaveTextContent('हिन्दी');
    });

    it('should call onLanguageChange callback when language is selected', async () => {
      const onLanguageChange = jest.fn();
      renderWithProvider(
        <LanguageSelector variant="dropdown" onLanguageChange={onLanguageChange} />
      );
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const punjabiOption = screen.getAllByRole('option').find(opt => 
        opt.textContent?.includes('Punjabi')
      );
      fireEvent.click(punjabiOption!);

      await waitFor(() => {
        expect(onLanguageChange).toHaveBeenCalledWith('pa');
      });
    });

    it('should close dropdown after language selection', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const tamilOption = screen.getAllByRole('option').find(opt => 
        opt.textContent?.includes('Tamil')
      );
      fireEvent.click(tamilOption!);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should work in inline variant without dropdown', async () => {
      renderWithProvider(<LanguageSelector variant="inline" />);
      
      // Find and click Telugu button
      const teluguButton = screen.getAllByRole('button').find(btn => 
        btn.textContent?.includes('Telugu')
      );
      fireEvent.click(teluguButton!);

      // Check that Telugu is now active
      await waitFor(() => {
        expect(teluguButton).toHaveClass('language-selector__inline-option--active');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open dropdown on Enter key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      toggleButton.focus();
      
      fireEvent.keyDown(toggleButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('should open dropdown on Space key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      toggleButton.focus();
      
      fireEvent.keyDown(toggleButton, { key: ' ' });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('should close dropdown on Escape key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(toggleButton, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should navigate options with ArrowDown key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const container = screen.getByRole('listbox').parentElement!;
      
      // Press ArrowDown
      fireEvent.keyDown(container, { key: 'ArrowDown' });

      // First option should be focused
      const options = screen.getAllByRole('option');
      await waitFor(() => {
        expect(document.activeElement).toBe(options[0]);
      });
    });

    it('should navigate options with ArrowUp key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const container = screen.getByRole('listbox').parentElement!;
      
      // Press ArrowUp (should wrap to last option)
      fireEvent.keyDown(container, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      await waitFor(() => {
        expect(document.activeElement).toBe(options[options.length - 1]);
      });
    });

    it('should select language on Enter key when option is focused', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const container = screen.getByRole('listbox').parentElement!;
      
      // Navigate to first option
      fireEvent.keyDown(container, { key: 'ArrowDown' });
      
      // Select with Enter
      fireEvent.keyDown(container, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should jump to first option on Home key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const container = screen.getByRole('listbox').parentElement!;
      
      fireEvent.keyDown(container, { key: 'Home' });

      const options = screen.getAllByRole('option');
      await waitFor(() => {
        expect(document.activeElement).toBe(options[0]);
      });
    });

    it('should jump to last option on End key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const container = screen.getByRole('listbox').parentElement!;
      
      fireEvent.keyDown(container, { key: 'End' });

      const options = screen.getAllByRole('option');
      await waitFor(() => {
        expect(document.activeElement).toBe(options[options.length - 1]);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on toggle button', () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Select Language');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have role="listbox" on dropdown options container', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
        expect(listbox).toHaveAttribute('aria-label', 'Available languages');
      });
    });

    it('should have role="option" on each language option', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(12);
        
        options.forEach(option => {
          expect(option).toHaveAttribute('aria-selected');
        });
      });
    });

    it('should have aria-selected="true" on current language', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const selectedOptions = options.filter(opt => 
          opt.getAttribute('aria-selected') === 'true'
        );
        expect(selectedOptions.length).toBe(1);
      });
    });

    it('should announce language change to screen readers', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const hindiOption = screen.getAllByRole('option').find(opt => 
        opt.textContent?.includes('Hindi')
      );
      fireEvent.click(hindiOption!);

      // Check for screen reader announcement
      await waitFor(() => {
        const announcement = document.querySelector('[role="status"]');
        expect(announcement).toBeInTheDocument();
      });
    });

    it('should have proper aria-modal on modal variant', async () => {
      renderWithProvider(<LanguageSelector variant="modal" />);
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-label', 'Select Language');
      });
    });

    it('should have aria-pressed on inline variant buttons', () => {
      renderWithProvider(<LanguageSelector variant="inline" />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('should close dropdown when clicking outside', async () => {
      renderWithProvider(
        <div>
          <LanguageSelector variant="dropdown" />
          <div data-testid="outside">Outside</div>
        </div>
      );
      
      const toggleButton = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Click outside
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });
});
