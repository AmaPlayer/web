import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-router-dom before importing the component
const mockNavigate = jest.fn();
jest.doMock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the FooterNav component
jest.doMock('../../../../components/layout/FooterNav', () => {
  return function MockFooterNav() {
    return <div data-testid="footer-nav">Footer Nav</div>;
  };
});

// Import after mocking
const ProfileEnhanced = require('../ProfileEnhanced').default;

const renderComponent = (component: React.ReactElement) => {
  return render(component);
};

describe('ProfileEnhanced', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders profile with default athlete role', () => {
    renderComponent(<ProfileEnhanced />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('baboo yogi')).toBeInTheDocument();
    expect(screen.getByText('Athlete')).toBeInTheDocument();
    expect(screen.getByText('Personal Details (Athlete)')).toBeInTheDocument();
  });

  it('displays role-specific sections for athlete', () => {
    renderComponent(<ProfileEnhanced />);

    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Talent Videos')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('changes role and updates sections accordingly', () => {
    renderComponent(<ProfileEnhanced />);

    // Open role selector
    const roleDropdown = screen.getByRole('button', { name: /current role: athlete/i });
    fireEvent.click(roleDropdown);

    // Select organization role
    const organizationOption = screen.getByText('Organization');
    fireEvent.click(organizationOption);

    // Check that role changed
    expect(screen.getByText('Personal Details (Organization)')).toBeInTheDocument();
    
    // Check that athlete-specific sections are hidden
    expect(screen.queryByText('Achievements')).not.toBeInTheDocument();
    expect(screen.queryByText('Talent Videos')).not.toBeInTheDocument();
    
    // Check that organization sections are shown
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('persists role selection to localStorage', () => {
    renderComponent(<ProfileEnhanced />);

    // Change role
    const roleDropdown = screen.getByRole('button', { name: /current role: athlete/i });
    fireEvent.click(roleDropdown);
    
    const coachOption = screen.getByText('Coach');
    fireEvent.click(coachOption);

    // Check localStorage
    expect(localStorage.getItem('userRole')).toBe('coaches');
  });

  it('loads saved role from localStorage on mount', () => {
    // Set role in localStorage
    localStorage.setItem('userRole', 'parents');

    renderComponent(<ProfileEnhanced />);

    expect(screen.getByText('Personal Details (Parent)')).toBeInTheDocument();
  });

  it('displays appropriate fields for each role', () => {
    renderComponent(<ProfileEnhanced />);

    // Check athlete fields
    expect(screen.getByText('NAME')).toBeInTheDocument();
    expect(screen.getByText('HEIGHT')).toBeInTheDocument();
    expect(screen.getByText('WEIGHT')).toBeInTheDocument();
    expect(screen.getByText('SPORT')).toBeInTheDocument();

    // Switch to organization role
    const roleDropdown = screen.getByRole('button', { name: /current role: athlete/i });
    fireEvent.click(roleDropdown);
    fireEvent.click(screen.getByText('Organization'));

    // Check organization fields
    expect(screen.getByText('ORGANIZATION NAME')).toBeInTheDocument();
    expect(screen.getByText('ORGANIZATION TYPE')).toBeInTheDocument();
    expect(screen.getByText('LOCATION')).toBeInTheDocument();
  });
});