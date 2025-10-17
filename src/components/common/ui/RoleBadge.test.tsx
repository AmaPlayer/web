import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleBadge } from './RoleBadge';
import { UserRole } from '../../../types/models/user';

describe('RoleBadge Component', () => {
  describe('Rendering for each role type', () => {
    it('should render athlete badge correctly', () => {
      render(<RoleBadge role="athlete" />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('role-badge--athlete');
      expect(screen.getByText('Athlete')).toBeInTheDocument();
    });

    it('should render parent badge correctly', () => {
      render(<RoleBadge role="parent" />);
      const badge = screen.getByRole('img', { name: /parent badge/i });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('role-badge--parent');
      expect(screen.getByText('Parent')).toBeInTheDocument();
    });

    it('should render organization badge correctly', () => {
      render(<RoleBadge role="organization" />);
      const badge = screen.getByRole('img', { name: /organization badge/i });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('role-badge--organization');
      expect(screen.getByText('Organization')).toBeInTheDocument();
    });

    it('should render coach badge correctly', () => {
      render(<RoleBadge role="coach" />);
      const badge = screen.getByRole('img', { name: /coach badge/i });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('role-badge--coach');
      expect(screen.getByText('Coach')).toBeInTheDocument();
    });
  });

  describe('Null/undefined role handling', () => {
    it('should return null when role is null', () => {
      const { container } = render(<RoleBadge role={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when role is undefined', () => {
      const { container } = render(<RoleBadge role={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when role is invalid', () => {
      const { container } = render(<RoleBadge role={'invalid' as UserRole} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Size variants', () => {
    it('should apply small size class', () => {
      render(<RoleBadge role="athlete" size="small" />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toHaveClass('role-badge--small');
    });

    it('should apply medium size class by default', () => {
      render(<RoleBadge role="athlete" />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toHaveClass('role-badge--medium');
    });

    it('should apply large size class', () => {
      render(<RoleBadge role="athlete" size="large" />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toHaveClass('role-badge--large');
    });
  });

  describe('showLabel prop', () => {
    it('should show label by default', () => {
      render(<RoleBadge role="athlete" />);
      expect(screen.getByText('Athlete')).toBeInTheDocument();
    });

    it('should show label when showLabel is true', () => {
      render(<RoleBadge role="athlete" showLabel={true} />);
      expect(screen.getByText('Athlete')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<RoleBadge role="athlete" showLabel={false} />);
      expect(screen.queryByText('Athlete')).not.toBeInTheDocument();
    });

    it('should still render icon when label is hidden', () => {
      render(<RoleBadge role="athlete" showLabel={false} />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toBeInTheDocument();
      const icon = badge.querySelector('.role-badge__icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility attributes', () => {
    it('should have role="img" attribute', () => {
      render(<RoleBadge role="athlete" />);
      const badge = screen.getByRole('img');
      expect(badge).toBeInTheDocument();
    });

    it('should have proper aria-label for athlete', () => {
      render(<RoleBadge role="athlete" />);
      const badge = screen.getByRole('img', { name: 'Athlete badge' });
      expect(badge).toBeInTheDocument();
    });

    it('should have proper aria-label for parent', () => {
      render(<RoleBadge role="parent" />);
      const badge = screen.getByRole('img', { name: 'Parent badge' });
      expect(badge).toBeInTheDocument();
    });

    it('should have proper aria-label for organization', () => {
      render(<RoleBadge role="organization" />);
      const badge = screen.getByRole('img', { name: 'Organization badge' });
      expect(badge).toBeInTheDocument();
    });

    it('should have proper aria-label for coach', () => {
      render(<RoleBadge role="coach" />);
      const badge = screen.getByRole('img', { name: 'Coach badge' });
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<RoleBadge role="athlete" className="custom-class" />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve default classes when custom className is added', () => {
      render(<RoleBadge role="athlete" className="custom-class" />);
      const badge = screen.getByRole('img', { name: /athlete badge/i });
      expect(badge).toHaveClass('role-badge');
      expect(badge).toHaveClass('role-badge--athlete');
      expect(badge).toHaveClass('custom-class');
    });
  });
});
