import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CertificatesSection from '../CertificatesSection';
import { Certificate } from '../../types/ProfileTypes';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Award: ({ size, ...props }: any) => <div data-testid="award-icon" data-size={size} {...props} />,
  Shield: ({ size, ...props }: any) => <div data-testid="shield-icon" data-size={size} {...props} />,
  ExternalLink: ({ size, ...props }: any) => <div data-testid="external-link-icon" data-size={size} {...props} />,
  Plus: ({ size, ...props }: any) => <div data-testid="plus-icon" data-size={size} {...props} />,
  Edit3: ({ size, ...props }: any) => <div data-testid="edit-icon" data-size={size} {...props} />,
  Trash2: ({ size, ...props }: any) => <div data-testid="trash-icon" data-size={size} {...props} />,
  AlertTriangle: ({ size, ...props }: any) => <div data-testid="alert-triangle-icon" data-size={size} {...props} />
}));

const mockCertificates: Certificate[] = [
  {
    id: '1',
    name: 'CPR Certification',
    issuingOrganization: 'American Red Cross',
    dateIssued: new Date('2023-01-15'),
    expirationDate: new Date('2025-01-15'),
    verificationUrl: 'https://verify.redcross.org/cert/123',
    certificateImageUrl: 'https://example.com/cert1.jpg'
  },
  {
    id: '2',
    name: 'First Aid Training',
    issuingOrganization: 'National Safety Council',
    dateIssued: new Date('2022-06-10'),
    expirationDate: new Date('2024-06-10'),
    verificationUrl: undefined,
    certificateImageUrl: undefined
  },
  {
    id: '3',
    name: 'Coaching License',
    issuingOrganization: 'Sports Authority',
    dateIssued: new Date('2021-03-20'),
    expirationDate: undefined,
    verificationUrl: 'https://verify.sports.org/license/456'
  }
];

const expiredCertificate: Certificate = {
  id: '4',
  name: 'Expired Certificate',
  issuingOrganization: 'Test Organization',
  dateIssued: new Date('2020-01-01'),
  expirationDate: new Date('2022-01-01'),
  verificationUrl: undefined
};

const expiringSoonCertificate: Certificate = {
  id: '5',
  name: 'Expiring Soon Certificate',
  issuingOrganization: 'Test Organization',
  dateIssued: new Date('2023-01-01'),
  expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  verificationUrl: undefined
};

describe('CertificatesSection', () => {
  const mockProps = {
    certificates: mockCertificates,
    isOwner: true,
    onAddCertificate: jest.fn(),
    onEditCertificate: jest.fn(),
    onDeleteCertificate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Certificate Display', () => {
    it('renders certificates section with proper heading', () => {
      render(<CertificatesSection {...mockProps} />);
      
      expect(screen.getByRole('heading', { name: /certificates/i })).toBeInTheDocument();
      expect(screen.getByRole('region')).toHaveAttribute('aria-labelledby', 'certificates-heading');
    });

    it('displays all certificates in sorted order (most recent first)', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const certificateCards = screen.getAllByRole('listitem');
      expect(certificateCards).toHaveLength(3);
      
      // Check that certificates are sorted by date issued (most recent first)
      expect(screen.getByText('CPR Certification')).toBeInTheDocument();
      expect(screen.getByText('First Aid Training')).toBeInTheDocument();
      expect(screen.getByText('Coaching License')).toBeInTheDocument();
    });

    it('displays certificate details correctly', () => {
      render(<CertificatesSection {...mockProps} />);
      
      // Check first certificate details
      expect(screen.getByText('CPR Certification')).toBeInTheDocument();
      expect(screen.getByText('American Red Cross')).toBeInTheDocument();
      expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
    });

    it('shows appropriate icons for different certificate types', () => {
      render(<CertificatesSection {...mockProps} />);
      
      // CPR certification should show shield icon (safety-related)
      const shieldIcons = screen.getAllByTestId('shield-icon');
      expect(shieldIcons.length).toBeGreaterThan(0);
      
      // Other certificates should show award icon
      const awardIcons = screen.getAllByTestId('award-icon');
      expect(awardIcons.length).toBeGreaterThan(0);
    });

    it('displays certificate images when available', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const certificateImage = screen.getByAltText('CPR Certification certificate');
      expect(certificateImage).toBeInTheDocument();
      expect(certificateImage).toHaveAttribute('src', 'https://example.com/cert1.jpg');
    });

    it('shows verification links when available', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const verificationLinks = screen.getAllByLabelText(/view certificate verification/i);
      expect(verificationLinks).toHaveLength(2); // Two certificates have verification URLs
      
      expect(verificationLinks[0]).toHaveAttribute('href', 'https://verify.redcross.org/cert/123');
      expect(verificationLinks[0]).toHaveAttribute('target', '_blank');
      expect(verificationLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no certificates exist', () => {
      render(<CertificatesSection {...mockProps} certificates={[]} />);
      
      expect(screen.getByText('No certificates yet')).toBeInTheDocument();
      expect(screen.getByText(/start adding your certificates/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add your first certificate/i })).toBeInTheDocument();
    });

    it('displays different empty state message for non-owners', () => {
      render(<CertificatesSection {...mockProps} certificates={[]} isOwner={false} />);
      
      expect(screen.getByText('No certificates yet')).toBeInTheDocument();
      expect(screen.getByText(/this user hasn't added any certificates yet/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add your first certificate/i })).not.toBeInTheDocument();
    });

    it('calls onAddCertificate when empty state button is clicked', () => {
      render(<CertificatesSection {...mockProps} certificates={[]} />);
      
      const addButton = screen.getByRole('button', { name: /add your first certificate/i });
      fireEvent.click(addButton);
      
      expect(mockProps.onAddCertificate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Expiration Date Handling', () => {
    it('displays valid expiration status for future dates', () => {
      // Create a certificate with future expiration date
      const futureCertificate: Certificate = {
        id: '6',
        name: 'Future Certificate',
        issuingOrganization: 'Test Organization',
        dateIssued: new Date('2023-01-01'),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        verificationUrl: undefined
      };
      
      render(<CertificatesSection {...mockProps} certificates={[futureCertificate]} />);
      
      expect(screen.getByText(/expires/i)).toBeInTheDocument();
    });

    it('displays expired status for past dates', () => {
      render(<CertificatesSection {...mockProps} certificates={[expiredCertificate]} />);
      
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('displays expiring soon warning for certificates expiring within 30 days', () => {
      render(<CertificatesSection {...mockProps} certificates={[expiringSoonCertificate]} />);
      
      expect(screen.getByText(/expires in \d+ days/i)).toBeInTheDocument();
    });

    it('does not display expiration info for certificates without expiration dates', () => {
      const certWithoutExpiration = mockCertificates.find(cert => !cert.expirationDate);
      render(<CertificatesSection {...mockProps} certificates={[certWithoutExpiration!]} />);
      
      expect(screen.queryByText(/expires/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/expired/i)).not.toBeInTheDocument();
    });
  });

  describe('Owner Actions', () => {
    it('shows add certificate button for owners', () => {
      render(<CertificatesSection {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /add new certificate/i })).toBeInTheDocument();
    });

    it('hides add certificate button for non-owners', () => {
      render(<CertificatesSection {...mockProps} isOwner={false} />);
      
      expect(screen.queryByRole('button', { name: /add new certificate/i })).not.toBeInTheDocument();
    });

    it('shows edit and delete buttons for each certificate when owner', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const editButtons = screen.getAllByLabelText(/edit .* certificate/i);
      const deleteButtons = screen.getAllByLabelText(/delete .* certificate/i);
      
      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    it('hides edit and delete buttons for non-owners', () => {
      render(<CertificatesSection {...mockProps} isOwner={false} />);
      
      expect(screen.queryByLabelText(/edit .* certificate/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/delete .* certificate/i)).not.toBeInTheDocument();
    });

    it('calls onAddCertificate when add button is clicked', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const addButton = screen.getByRole('button', { name: /add new certificate/i });
      fireEvent.click(addButton);
      
      expect(mockProps.onAddCertificate).toHaveBeenCalledTimes(1);
    });

    it('calls onEditCertificate with correct certificate when edit button is clicked', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const editButtons = screen.getAllByLabelText(/edit .* certificate/i);
      fireEvent.click(editButtons[0]);
      
      expect(mockProps.onEditCertificate).toHaveBeenCalledTimes(1);
      expect(mockProps.onEditCertificate).toHaveBeenCalledWith(mockCertificates[0]);
    });

    it('calls onDeleteCertificate with correct certificate ID when delete button is clicked', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const deleteButtons = screen.getAllByLabelText(/delete .* certificate/i);
      fireEvent.click(deleteButtons[0]);
      
      expect(mockProps.onDeleteCertificate).toHaveBeenCalledTimes(1);
      expect(mockProps.onDeleteCertificate).toHaveBeenCalledWith(mockCertificates[0].id);
    });

    it('prevents event propagation when action buttons are clicked', () => {
      const mockStopPropagation = jest.fn();
      render(<CertificatesSection {...mockProps} />);
      
      const editButton = screen.getAllByLabelText(/edit .* certificate/i)[0];
      
      // Create a mock event with stopPropagation
      const mockEvent = {
        ...new MouseEvent('click'),
        stopPropagation: mockStopPropagation
      };
      
      fireEvent.click(editButton, mockEvent);
      
      expect(mockProps.onEditCertificate).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<CertificatesSection {...mockProps} />);
      
      expect(screen.getByRole('region', { name: /certificates/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /list of certificates/i })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('has proper heading structure', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 2, name: /certificates/i });
      const certificateHeadings = screen.getAllByRole('heading', { level: 3 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(certificateHeadings).toHaveLength(3);
    });

    it('has proper aria-describedby attributes for dates', () => {
      render(<CertificatesSection {...mockProps} />);
      
      const dateElements = screen.getAllByLabelText(/date issued:/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('has proper button labels for screen readers', () => {
      render(<CertificatesSection {...mockProps} />);
      
      expect(screen.getByLabelText('Add new certificate')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit CPR Certification certificate')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete CPR Certification certificate')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly using Intl.DateTimeFormat', () => {
      render(<CertificatesSection {...mockProps} />);
      
      // Check that dates are formatted as "Month Day, Year"
      expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
      expect(screen.getByText('June 10, 2022')).toBeInTheDocument();
      expect(screen.getByText('March 20, 2021')).toBeInTheDocument();
    });
  });
});