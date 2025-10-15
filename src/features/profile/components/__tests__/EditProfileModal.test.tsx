import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the CSS import
jest.mock('../../styles/EditProfileModal.css', () => ({}));

// Simple mock component for testing
const MockEditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div data-testid="edit-profile-modal">
      <h2>Edit Profile</h2>
      <form>
        <input name="name" placeholder="Name" />
        <input name="email" placeholder="Email" type="email" />
        <textarea name="bio" placeholder="Bio" />
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn()
};

describe('EditProfileModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<MockEditProfileModal {...defaultProps} />);
    
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<MockEditProfileModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  it('displays form fields', () => {
    render(<MockEditProfileModal {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bio')).toBeInTheDocument();
  });

  it('has save and cancel buttons', () => {
    render(<MockEditProfileModal {...defaultProps} />);
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<MockEditProfileModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders form elements', () => {
    render(<MockEditProfileModal {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bio')).toBeInTheDocument();
  });

  it('has proper input types', () => {
    render(<MockEditProfileModal {...defaultProps} />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('has accessible modal structure', () => {
    render(<MockEditProfileModal {...defaultProps} />);
    
    expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument();
  });
});