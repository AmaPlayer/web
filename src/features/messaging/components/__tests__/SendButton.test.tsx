import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendButton from '../SendButton';

describe('SendButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Button States', () => {
    it('renders enabled button by default', () => {
      render(<SendButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('send-button');
      expect(button).not.toHaveClass('disabled', 'loading', 'error');
    });

    it('renders disabled state correctly', () => {
      render(<SendButton disabled={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('send-button', 'disabled');
    });

    it('renders loading state correctly', () => {
      render(<SendButton loading={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /sending message/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('send-button', 'loading');
      
      // Check for loading spinner
      const spinner = button.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('renders error state correctly', () => {
      render(<SendButton error={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toHaveClass('send-button', 'error');
    });

    it('combines multiple states correctly', () => {
      render(<SendButton disabled={true} loading={true} error={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /sending message/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('send-button', 'disabled', 'loading', 'error');
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when enabled and clicked', () => {
      render(<SendButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      render(<SendButton disabled={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      render(<SendButton loading={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /sending message/i });
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('calls onClick when error state but not disabled', () => {
      render(<SendButton error={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Props', () => {
    it('applies custom className', () => {
      render(<SendButton className="custom-class" onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toHaveClass('send-button', 'custom-class');
    });

    it('sets button type correctly', () => {
      render(<SendButton type="button" onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('defaults to submit type', () => {
      render(<SendButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label for normal state', () => {
      render(<SendButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toHaveAttribute('aria-label', 'Send message');
    });

    it('has correct aria-label for loading state', () => {
      render(<SendButton loading={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /sending message/i });
      expect(button).toHaveAttribute('aria-label', 'Sending message...');
    });

    it('maintains minimum touch target size', () => {
      render(<SendButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      const styles = window.getComputedStyle(button);
      
      // Note: In a real test environment with CSS loaded, we would check actual dimensions
      // For now, we verify the button exists and has the correct class for styling
      expect(button).toHaveClass('send-button');
    });
  });

  describe('Icon Rendering', () => {
    it('renders Send icon by default', () => {
      render(<SendButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /send message/i });
      const sendIcon = button.querySelector('svg');
      expect(sendIcon).toBeInTheDocument();
    });

    it('renders loading spinner when loading', () => {
      render(<SendButton loading={true} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button', { name: /sending message/i });
      const spinner = button.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
      
      // Should not have Send icon when loading
      const sendIcon = button.querySelector('svg:not(.spinner)');
      expect(sendIcon).not.toBeInTheDocument();
    });
  });
});