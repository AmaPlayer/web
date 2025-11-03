/**
 * Component Tests for ThemeToggle
 * 
 * Tests that correct icon is rendered for current theme, theme toggle on click,
 * keyboard accessibility, and screen reader announcements.
 * 
 * Requirements tested: 7.1, 7.2, 7.3, 7.4, 7.5, 11.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
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
    { code: 'en', name: 'English', nativeName: 'English' }
  ],
  getTranslation: (lang: string, key: string) => key
}));

describe('ThemeToggle Component', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <UnifiedPreferencesProvider>
        {component}
      </UnifiedPreferencesProvider>
    );
  };

  describe('Icon Rendering', () => {
    it('should render moon icon when in light mode', async () => {
      // Start with light mode by mocking localStorage
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify({ theme: 'light', language: 'en', lastUpdated: Date.now() })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

      renderWithProvider(<ThemeToggle variant="icon" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      // Moon icon should be present (path element with specific d attribute)
      const svgs = document.querySelectorAll('svg');
      const moonIcon = Array.from(svgs).find(svg => 
        svg.querySelector('path[d*="M21 12.79"]')
      );
      expect(moonIcon).toBeInTheDocument();
    });

    it('should render sun icon when in dark mode', async () => {
      // Start with dark mode (default)
      renderWithProvider(<ThemeToggle variant="icon" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      // Sun icon should be present (circle and lines)
      const svgs = document.querySelectorAll('svg');
      const sunIcon = Array.from(svgs).find(svg => 
        svg.querySelector('circle[cx="12"][cy="12"][r="5"]')
      );
      expect(sunIcon).toBeInTheDocument();
    });

    it('should change icon after theme toggle', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      
      // Initially should show sun icon (dark mode)
      let svgs = document.querySelectorAll('svg');
      let sunIcon = Array.from(svgs).find(svg => 
        svg.querySelector('circle[cx="12"][cy="12"][r="5"]')
      );
      expect(sunIcon).toBeInTheDocument();

      // Click to toggle
      fireEvent.click(button);

      await waitFor(() => {
        // Should now show moon icon (light mode)
        svgs = document.querySelectorAll('svg');
        const moonIcon = Array.from(svgs).find(svg => 
          svg.querySelector('path[d*="M21 12.79"]')
        );
        expect(moonIcon).toBeInTheDocument();
      });
    });

    it('should render correct icon in switch variant', async () => {
      renderWithProvider(<ThemeToggle variant="switch" />);

      await waitFor(() => {
        const button = screen.getByRole('switch');
        expect(button).toBeInTheDocument();
      });

      // Sun icon should be in the switch thumb (dark mode)
      const svgs = document.querySelectorAll('svg');
      const sunIcon = Array.from(svgs).find(svg => 
        svg.querySelector('circle[cx="12"][cy="12"][r="5"]')
      );
      expect(sunIcon).toBeInTheDocument();
    });

    it('should render correct icon in button variant', async () => {
      renderWithProvider(<ThemeToggle variant="button" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      // Sun icon should be present (dark mode)
      const svgs = document.querySelectorAll('svg');
      const sunIcon = Array.from(svgs).find(svg => 
        svg.querySelector('circle[cx="12"][cy="12"][r="5"]')
      );
      expect(sunIcon).toBeInTheDocument();
    });
  });

  describe('Theme Toggle on Click', () => {
    it('should toggle theme when clicked in icon variant', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      
      // Check initial aria-pressed state (dark mode = true)
      expect(button).toHaveAttribute('aria-pressed', 'true');

      // Click to toggle
      fireEvent.click(button);

      await waitFor(() => {
        // Should now be light mode (aria-pressed = false)
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should toggle theme when clicked in switch variant', async () => {
      renderWithProvider(<ThemeToggle variant="switch" />);

      const button = screen.getByRole('switch');
      
      // Check initial aria-checked state (dark mode = true)
      expect(button).toHaveAttribute('aria-checked', 'true');

      // Click to toggle
      fireEvent.click(button);

      await waitFor(() => {
        // Should now be light mode (aria-checked = false)
        expect(button).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('should toggle theme when clicked in button variant', async () => {
      renderWithProvider(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      
      // Check initial text (dark mode shows "Light Mode")
      expect(button).toHaveTextContent('Light Mode');

      // Click to toggle
      fireEvent.click(button);

      await waitFor(() => {
        // Should now show "Dark Mode" (in light mode)
        expect(button).toHaveTextContent('Dark Mode');
      });
    });

    it('should toggle theme multiple times', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      
      // Initial state: dark mode
      expect(button).toHaveAttribute('aria-pressed', 'true');

      // Toggle to light
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });

      // Toggle back to dark
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'true');
      });

      // Toggle to light again
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should update aria-label after toggle', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      
      // Initial: dark mode, label says "Switch to light mode"
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');

      // Toggle to light mode
      fireEvent.click(button);

      await waitFor(() => {
        // Now in light mode, label says "Switch to dark mode"
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should toggle theme on Enter key', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveAttribute('aria-pressed', 'true');

      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter' });

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should toggle theme on Space key', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveAttribute('aria-pressed', 'true');

      // Press Space
      fireEvent.keyDown(button, { key: ' ' });

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should prevent default behavior on Space key', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      button.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default behavior on Enter key', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      button.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not toggle on other keys', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      const initialState = button.getAttribute('aria-pressed');

      // Press random keys
      fireEvent.keyDown(button, { key: 'a' });
      fireEvent.keyDown(button, { key: 'Escape' });
      fireEvent.keyDown(button, { key: 'Tab' });

      // State should not change
      expect(button).toHaveAttribute('aria-pressed', initialState);
    });

    it('should work with keyboard in switch variant', async () => {
      renderWithProvider(<ThemeToggle variant="switch" />);

      const button = screen.getByRole('switch');
      button.focus();
      
      expect(button).toHaveAttribute('aria-checked', 'true');

      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter' });

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('should work with keyboard in button variant', async () => {
      renderWithProvider(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveTextContent('Light Mode');

      // Press Space
      fireEvent.keyDown(button, { key: ' ' });

      await waitFor(() => {
        expect(button).toHaveTextContent('Dark Mode');
      });
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should have screen reader announcement element', () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce theme change to screen readers', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      const announcement = document.querySelector('[role="status"]');
      
      // Initially empty
      expect(announcement?.textContent).toBe('');

      // Toggle theme
      fireEvent.click(button);

      await waitFor(() => {
        // Should announce the new theme
        expect(announcement?.textContent).toMatch(/mode enabled/i);
      });
    });

    it('should announce "Light mode enabled" when switching to light', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      const announcement = document.querySelector('[role="status"]');
      
      // Start in dark mode, toggle to light
      fireEvent.click(button);

      await waitFor(() => {
        expect(announcement?.textContent).toBe('Light mode enabled');
      });
    });

    it('should announce "Dark mode enabled" when switching to dark', async () => {
      // Start with light mode
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify({ theme: 'light', language: 'en', lastUpdated: Date.now() })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

      renderWithProvider(<ThemeToggle variant="icon" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      const announcement = document.querySelector('[role="status"]');
      
      // Toggle to dark mode
      fireEvent.click(button);

      await waitFor(() => {
        expect(announcement?.textContent).toBe('Dark mode enabled');
      });
    });

    it('should update announcement on each toggle', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      const announcement = document.querySelector('[role="status"]');
      
      // First toggle: dark to light
      fireEvent.click(button);
      await waitFor(() => {
        expect(announcement?.textContent).toBe('Light mode enabled');
      });

      // Second toggle: light to dark
      fireEvent.click(button);
      await waitFor(() => {
        expect(announcement?.textContent).toBe('Dark mode enabled');
      });

      // Third toggle: dark to light
      fireEvent.click(button);
      await waitFor(() => {
        expect(announcement?.textContent).toBe('Light mode enabled');
      });
    });
  });

  describe('Variants and Props', () => {
    it('should render with showLabel prop in icon variant', () => {
      renderWithProvider(<ThemeToggle variant="icon" showLabel={true} />);

      const button = screen.getByRole('button');
      // Should show "Light" or "Dark" text
      expect(button.textContent).toMatch(/Light|Dark/);
    });

    it('should render with showLabel prop in switch variant', () => {
      renderWithProvider(<ThemeToggle variant="switch" showLabel={true} />);

      const button = screen.getByRole('switch');
      // Should show "Light Mode" or "Dark Mode" text
      expect(button.textContent).toMatch(/Mode/);
    });

    it('should render with small size', () => {
      renderWithProvider(<ThemeToggle variant="icon" size="small" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle--small');
    });

    it('should render with medium size (default)', () => {
      renderWithProvider(<ThemeToggle variant="icon" size="medium" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle--medium');
    });

    it('should render with large size', () => {
      renderWithProvider(<ThemeToggle variant="icon" size="large" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle--large');
    });

    it('should apply custom className', () => {
      renderWithProvider(<ThemeToggle variant="icon" className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should have proper button type attribute', () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have title attribute for tooltip', () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title');
      expect(button.getAttribute('title')).toMatch(/Switch to/);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA attributes in icon variant', () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-pressed');
      expect(button).toHaveAttribute('title');
    });

    it('should have proper ARIA attributes in switch variant', () => {
      renderWithProvider(<ThemeToggle variant="switch" />);

      const button = screen.getByRole('switch');
      expect(button).toHaveAttribute('aria-checked');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });

    it('should have proper ARIA attributes in button variant', () => {
      renderWithProvider(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-pressed');
      expect(button).toHaveAttribute('title');
    });

    it('should have aria-hidden on decorative icons', () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const svgs = document.querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should be keyboard focusable', () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('should maintain focus after toggle', async () => {
      renderWithProvider(<ThemeToggle variant="icon" />);

      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
    });
  });
});
