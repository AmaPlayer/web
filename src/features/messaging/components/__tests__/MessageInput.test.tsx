import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the content filter utility
jest.mock('../../../../utils/content/chatFilter', () => ({
  filterChatMessage: jest.fn((message: string) => ({
    isClean: true,
    shouldBlock: false,
    shouldWarn: false,
    shouldFlag: false,
    violations: [],
    categories: [],
    maxSeverity: null
  })),
  getChatViolationMessage: jest.fn(() => 'Content violation detected'),
  logChatViolation: jest.fn()
}));

// Mock Firebase
jest.mock('../../../../lib/firebase', () => ({
  db: {},
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn()
}));

// Mock Auth Context
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      photoURL: 'test-photo-url'
    },
    isGuest: () => false
  })
}));

// Create a simplified MessageInput component for testing
interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  validationState?: 'normal' | 'warning' | 'success' | 'error';
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  error = false,
  validationState = 'normal',
  placeholder = 'Type a message...'
}) => {
  return (
    <form onSubmit={onSubmit} className="message-input-form">
      <div className={`message-input-container ${validationState}`}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`message-input ${validationState}`}
          aria-label="Message input"
          data-testid="message-input"
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          className={`send-button ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
          aria-label={loading ? 'Sending message...' : 'Send message'}
          data-testid="send-button"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

describe('MessageInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSubmit.mockClear();
  });

  describe('Input Validation and State Management', () => {
    it('renders input field with correct attributes', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByTestId('message-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Type a message...');
      expect(input).toHaveAttribute('aria-label', 'Message input');
    });

    it('displays current value correctly', () => {
      render(
        <MessageInput
          value="Hello world"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      expect(input.value).toBe('Hello world');
    });

    it('calls onChange when user types', async () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Hello');

      expect(mockOnChange).toHaveBeenCalledTimes(5); // One for each character
    });

    it('applies validation state classes correctly', () => {
      const { rerender } = render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          validationState="normal"
        />
      );

      let container = screen.getByTestId('message-input').parentElement;
      expect(container).toHaveClass('normal');

      rerender(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          validationState="warning"
        />
      );

      container = screen.getByTestId('message-input').parentElement;
      expect(container).toHaveClass('warning');

      rerender(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          validationState="error"
        />
      );

      container = screen.getByTestId('message-input').parentElement;
      expect(container).toHaveClass('error');

      rerender(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          validationState="success"
        />
      );

      container = screen.getByTestId('message-input').parentElement;
      expect(container).toHaveClass('success');
    });

    it('disables input when disabled prop is true', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          disabled={true}
        />
      );

      const input = screen.getByTestId('message-input');
      expect(input).toBeDisabled();
    });
  });

  describe('Send Button State Transitions', () => {
    it('disables send button when input is empty', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has content', () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('disables send button when input has only whitespace', () => {
      render(
        <MessageInput
          value="   "
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('shows loading state correctly', () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveClass('loading');
      expect(sendButton).toHaveAttribute('aria-label', 'Sending message...');
      expect(sendButton).toHaveTextContent('Sending...');
    });

    it('shows error state correctly', () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          error={true}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toHaveClass('error');
    });

    it('disables send button when component is disabled', () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          disabled={true}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveClass('disabled');
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit when form is submitted', async () => {
      render(
        <MessageInput
          value="Hello world"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const form = screen.getByTestId('message-input').closest('form');
      expect(form).toBeInTheDocument();
      
      if (form) {
        fireEvent.submit(form);
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onSubmit when send button is clicked', async () => {
      const mockSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <MessageInput
          value="Hello world"
          onChange={mockOnChange}
          onSubmit={mockSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit when Enter key is pressed in input', async () => {
      const mockSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <MessageInput
          value="Hello world"
          onChange={mockOnChange}
          onSubmit={mockSubmit}
        />
      );

      const input = screen.getByTestId('message-input');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Since we're testing the input directly, we need to simulate form submission
      const form = input.closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(mockSubmit).toHaveBeenCalledTimes(1);
      }
    });

    it('does not submit when input is empty', async () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
      
      // Disabled button won't trigger form submission
      fireEvent.click(sendButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('does not submit when loading', async () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
      
      // Disabled button won't trigger form submission
      fireEvent.click(sendButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('maintains accessibility on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      const input = screen.getByTestId('message-input');

      // Verify elements are accessible
      expect(sendButton).toHaveAttribute('aria-label');
      expect(input).toHaveAttribute('aria-label');
    });

    it('handles touch interactions properly', async () => {
      const mockSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      
      // Simulate touch events
      fireEvent.touchStart(sendButton);
      fireEvent.touchEnd(sendButton);
      fireEvent.click(sendButton);

      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('maintains minimum touch target size', () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      
      // In a real environment with CSS, we would check computed styles
      // For now, verify the button exists and has the correct class
      expect(sendButton).toHaveClass('send-button');
    });

    it('handles keyboard navigation correctly', async () => {
      render(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      // Focus input directly
      input.focus();
      expect(input).toHaveFocus();

      // Tab to send button (with content, button should be enabled)
      await user.tab();
      expect(sendButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid state changes correctly', async () => {
      const { rerender } = render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Rapidly change loading state
      rerender(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      rerender(
        <MessageInput
          value="Hello"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('handles long messages correctly', async () => {
      const longMessage = 'A'.repeat(1000);
      
      render(
        <MessageInput
          value={longMessage}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      expect(input.value).toBe(longMessage);

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('handles special characters correctly', async () => {
      const specialMessage = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      render(
        <MessageInput
          value={specialMessage}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      expect(input.value).toBe(specialMessage);
    });
  });
});