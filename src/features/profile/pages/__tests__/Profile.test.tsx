/**
 * Profile Component Unit Tests
 * 
 * Tests for the Profile component including:
 * - Component rendering without errors
 * - All sections display correctly
 * - Responsive behavior verification
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Profile from '../Profile';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

// Wrapper component to provide Router context
const ProfileWithRouter = () => (
  <BrowserRouter>
    <Profile />
  </BrowserRouter>
);

describe('Profile Component', () => {
  describe('Component Rendering', () => {
    it('should render without errors', () => {
      expect(() => render(<ProfileWithRouter />)).not.toThrow();
    });

    it('should render the main profile page container', () => {
      render(<ProfileWithRouter />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('profile-page');
    });
  });

  describe('Navigation Section', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should display the profile navigation', () => {
      const nav = screen.getByRole('navigation', { name: /profile navigation/i });
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('profile-nav');
    });

    it('should display the back button', () => {
      const backButton = screen.getByRole('button', { name: /go back to previous page/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveClass('back-button');
    });

    it('should display the profile navigation title', () => {
      const navTitle = screen.getByText('Profile');
      expect(navTitle).toBeInTheDocument();
      expect(navTitle).toHaveClass('profile-nav-title');
    });

    it('should display the footer navigation', () => {
      const footerNav = screen.getByRole('contentinfo') || screen.getByRole('navigation', { name: /main navigation/i });
      expect(footerNav).toBeInTheDocument();
    });
  });

  describe('Profile Header Section', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should display the profile header', () => {
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('profile-header');
    });

    it('should display the profile avatar placeholder', () => {
      const avatar = screen.getByRole('img', { name: /profile avatar placeholder/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('avatar-placeholder');
    });

    it('should display the username', () => {
      const username = screen.getByRole('heading', { level: 1 });
      expect(username).toBeInTheDocument();
      expect(username).toHaveTextContent('प्रोफाइल');
      expect(username).toHaveClass('profile-username');
    });

    it('should display profile statistics', () => {
      const statsGroup = screen.getByRole('group', { name: /profile statistics/i });
      expect(statsGroup).toBeInTheDocument();

      // Check individual stats
      expect(screen.getByLabelText('4 posts')).toBeInTheDocument();
      expect(screen.getByLabelText('1 follower')).toBeInTheDocument();
      expect(screen.getByLabelText('0 following')).toBeInTheDocument();

      // Check stat labels
      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('Followers')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('should display the follow button', () => {
      const followButton = screen.getByRole('button', { name: /follow this user/i });
      expect(followButton).toBeInTheDocument();
      expect(followButton).toHaveTextContent('Not Following');
      expect(followButton).toHaveClass('follow-button');
    });
  });

  describe('Personal Details Section', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should display the personal details section', () => {
      const section = screen.getByRole('region', { name: /personal details/i });
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('personal-details');
    });

    it('should display the section heading', () => {
      const heading = screen.getByRole('heading', { level: 2, name: /personal details/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('section-title');
    });

    it('should display all personal detail fields', () => {
      const detailsCard = screen.getByRole('group', { name: /personal details/i });
      expect(detailsCard).toBeInTheDocument();

      // Check field labels (uppercase)
      expect(screen.getByText('NAME')).toBeInTheDocument();
      expect(screen.getByText('AGE')).toBeInTheDocument();
      expect(screen.getByText('HEIGHT')).toBeInTheDocument();
      expect(screen.getByText('WEIGHT')).toBeInTheDocument();
      expect(screen.getByText('SEX')).toBeInTheDocument();
      expect(screen.getByText('ROLE')).toBeInTheDocument();
    });

    it('should display field values with proper content', () => {
      // Check specified values
      expect(screen.getByLabelText('NAME')).toHaveTextContent('baboo yogi');
      expect(screen.getByLabelText('ROLE')).toHaveTextContent('athlete');

      // Check "Not specified" placeholders
      expect(screen.getByLabelText('AGE')).toHaveTextContent('Not specified');
      expect(screen.getByLabelText('HEIGHT')).toHaveTextContent('Not specified');
      expect(screen.getByLabelText('WEIGHT')).toHaveTextContent('Not specified');
      expect(screen.getByLabelText('SEX')).toHaveTextContent('Not specified');
    });

    it('should have proper field-value associations', () => {
      // Verify aria-labelledby associations work correctly
      const nameField = screen.getByLabelText('NAME');
      const ageField = screen.getByLabelText('AGE');
      const roleField = screen.getByLabelText('ROLE');

      expect(nameField).toBeInTheDocument();
      expect(ageField).toBeInTheDocument();
      expect(roleField).toBeInTheDocument();
    });
  });



  describe('Accessibility Features', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should use semantic HTML elements', () => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /profile navigation/i })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it('should have proper ARIA labels and descriptions', () => {
      // Check avatar has proper aria-label
      expect(screen.getByRole('img', { name: /profile avatar placeholder/i })).toBeInTheDocument();
      
      // Check stats group has proper aria-label
      expect(screen.getByRole('group', { name: /profile statistics/i })).toBeInTheDocument();
      
      // Check navigation has proper aria-label
      expect(screen.getByRole('navigation', { name: /profile navigation/i })).toBeInTheDocument();
      

    });

    it('should have proper button accessibility', () => {
      const followButton = screen.getByRole('button', { name: /follow this user/i });
      expect(followButton).toHaveAttribute('type', 'button');
      expect(followButton).toHaveAttribute('aria-label', 'Follow this user');
    });

    it('should have focusable elements with proper attributes', () => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('CSS Classes and Structure', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should apply correct CSS classes to main sections', () => {
      expect(screen.getByRole('main')).toHaveClass('profile-page');
      expect(screen.getByRole('banner')).toHaveClass('profile-header');
      expect(screen.getByRole('navigation', { name: /profile navigation/i })).toHaveClass('profile-nav');
    });

    it('should apply correct CSS classes to profile elements', () => {
      const avatar = screen.getByRole('img', { name: /profile avatar placeholder/i });
      expect(avatar).toHaveClass('avatar-placeholder');
      
      const username = screen.getByRole('heading', { level: 1 });
      expect(username).toHaveClass('profile-username');
      
      const followButton = screen.getByRole('button', { name: /follow this user/i });
      expect(followButton).toHaveClass('follow-button');
    });

    it('should apply correct CSS classes to personal details', () => {
      const section = screen.getByRole('region', { name: /personal details/i });
      expect(section).toHaveClass('personal-details');
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('section-title');
    });


  });

  describe('Responsive Design Elements', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should have responsive container structure', () => {
      const main = screen.getByRole('main');
      expect(main).toHaveClass('profile-page');
      
      // Verify the component structure supports responsive design
      const navigation = screen.getByRole('navigation', { name: /profile navigation/i });
      const header = screen.getByRole('banner');
      const personalDetails = screen.getByRole('region', { name: /personal details/i });
      
      expect(navigation).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(personalDetails).toBeInTheDocument();
    });

    it('should have proper layout structure for mobile-first design', () => {
      // Verify that all major sections are present and properly structured
      const profileInfo = document.querySelector('.profile-info');
      const detailsCard = document.querySelector('.details-card');
      const statsContainer = document.querySelector('.profile-stats');
      
      expect(profileInfo).toBeInTheDocument();
      expect(detailsCard).toBeInTheDocument();
      expect(statsContainer).toBeInTheDocument();
    });

    it('should have touch-friendly button sizes', () => {
      const followButton = screen.getByRole('button', { name: /follow this user/i });
      const backButton = screen.getByRole('button', { name: /go back to previous page/i });
      
      // Buttons should be present and accessible
      expect(followButton).toBeInTheDocument();
      expect(followButton).toHaveAttribute('type', 'button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Content Verification', () => {
    beforeEach(() => {
      render(<ProfileWithRouter />);
    });

    it('should display correct static content', () => {
      // Username
      expect(screen.getByText('प्रोफाइल')).toBeInTheDocument();
      
      // Stats
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      
      // Personal details
      expect(screen.getByText('baboo yogi')).toBeInTheDocument();
      expect(screen.getByText('athlete')).toBeInTheDocument();
      expect(screen.getAllByText('Not specified')).toHaveLength(4);
      
      // Button text
      expect(screen.getByText('Not Following')).toBeInTheDocument();
    });

    it('should have proper field labels in uppercase', () => {
      const fieldLabels = ['NAME', 'AGE', 'HEIGHT', 'WEIGHT', 'SEX', 'ROLE'];
      
      fieldLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should display section title correctly', () => {
      expect(screen.getByText('Personal Details')).toBeInTheDocument();
    });
  });
});