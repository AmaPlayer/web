import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoleSelector from '../RoleSelector';
import { UserRole } from '../../types/ProfileTypes';

describe('RoleSelector', () => {
  const mockOnRoleChange = jest.fn();

  beforeEach(() => {
    mockOnRoleChange.mockClear();
  });

  it('renders with current role displayed', () => {
    render(
      <RoleSelector
        currentRole="athlete"
        onRoleChange={mockOnRoleChange}
      />
    );

    expect(screen.getByText('Athlete')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <RoleSelector
        currentRole="athlete"
        onRoleChange={mockOnRoleChange}
      />
    );

    const dropdown = screen.getByRole('button', { name: /current role: athlete/i });
    fireEvent.click(dropdown);

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Coach')).toBeInTheDocument();
  });

  it('calls onRoleChange when a role is selected', () => {
    render(
      <RoleSelector
        currentRole="athlete"
        onRoleChange={mockOnRoleChange}
      />
    );

    const dropdown = screen.getByRole('button', { name: /current role: athlete/i });
    fireEvent.click(dropdown);

    const organizationOption = screen.getByText('Organization');
    fireEvent.click(organizationOption);

    expect(mockOnRoleChange).toHaveBeenCalledWith('organization');
  });

  it('supports keyboard navigation', () => {
    render(
      <RoleSelector
        currentRole="athlete"
        onRoleChange={mockOnRoleChange}
      />
    );

    const dropdown = screen.getByRole('button', { name: /current role: athlete/i });
    
    // Open with Enter key
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    expect(screen.getByText('Organization')).toBeInTheDocument();

    // Select with Enter key
    const organizationOption = screen.getByText('Organization');
    fireEvent.keyDown(organizationOption, { key: 'Enter' });

    expect(mockOnRoleChange).toHaveBeenCalledWith('organization');
  });
});