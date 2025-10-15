import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'Test error message'
  };

  it('renders error message correctly', () => {
    render(<ErrorMessage {...defaultProps} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('error-message error');
  });

  it('renders different error types', () => {
    const { rerender } = render(<ErrorMessage {...defaultProps} type="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('error-message warning');

    rerender(<ErrorMessage {...defaultProps} type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('error-message info');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorMessage {...defaultProps} onRetry={onRetry} retryLabel="Try Again" />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render action buttons when callbacks are not provided', () => {
    render(<ErrorMessage {...defaultProps} />);
    
    expect(screen.queryByLabelText('Dismiss error')).not.toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorMessage {...defaultProps} className="custom-class" />);
    
    expect(screen.getByRole('alert')).toHaveClass('error-message error custom-class');
  });
});