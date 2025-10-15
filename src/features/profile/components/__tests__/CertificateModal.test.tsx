import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CertificateModal from '../CertificateModal';
import { Certificate } from '../../types/ProfileTypes';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  X: ({ size, ...props }: any) => <div data-testid="x-icon" data-size={size} {...props} />,
  Award: ({ size, ...props }: any) => <div data-testid="award-icon" data-size={size} {...props} />,
  Upload: ({ size, ...props }: any) => <div data-testid="upload-icon" data-size={size} {...props} />,
  Calendar: ({ size, ...props }: any) => <div data-testid="calendar-icon" data-size={size} {...props} />,
  Building: ({ size, ...props }: any) => <div data-testid="building-icon" data-size={size} {...props} />,
  ExternalLink: ({ size, ...props }: any) => <div data-testid="external-link-icon" data-size={size} {...props} />
}));

const mockCertificate: Certificate = {
  id: '1',
  name: 'CPR Certification',
  issuingOrganization: 'American Red Cross',
  dateIssued: new Date('2023-01-15'),
  expirationDate: new Date('2025-01-15'),
  verificationUrl: 'https://verify.redcross.org/cert/123',
  certificateImageUrl: 'https://example.com/cert1.jpg'
};

describe('CertificateModal', () => {
  const mockProps = {
    isOpen: true,
    certificate: null,
    onClose: jest.fn(),
    onSave: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('renders modal when isOpen is true', () => {
      render(<CertificateModal {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /add certificate/i })).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<CertificateModal {...mockProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows "Edit Certificate" title when editing existing certificate', () => {
      render(<CertificateModal {...mockProps} certificate={mockCertificate} />);
      
      expect(screen.getByRole('heading', { name: /edit certificate/i })).toBeInTheDocument();
    });

    it('shows "Add Certificate" title when adding new certificate', () => {
      render(<CertificateModal {...mockProps} certificate={null} />);
      
      expect(screen.getByRole('heading', { name: /add certificate/i })).toBeInTheDocument();
    });
  });

  describe('Form Population', () => {
    it('populates form fields when editing existing certificate', () => {
      render(<CertificateModal {...mockProps} certificate={mockCertificate} />);
      
      expect(screen.getByDisplayValue('CPR Certification')).toBeInTheDocument();
      expect(screen.getByDisplayValue('American Red Cross')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023-01-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-01-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://verify.redcross.org/cert/123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/cert1.jpg')).toBeInTheDocument();
    });

    it('shows empty form when adding new certificate', () => {
      render(<CertificateModal {...mockProps} certificate={null} />);
      
      const nameInput = screen.getByLabelText(/certificate name/i);
      const organizationInput = screen.getByLabelText(/issuing organization/i);
      
      expect(nameInput).toHaveValue('');
      expect(organizationInput).toHaveValue('');
    });

    it('resets form when modal is reopened', () => {
      const { rerender } = render(<CertificateModal {...mockProps} isOpen={false} />);
      
      // Open modal and fill form
      rerender(<CertificateModal {...mockProps} isOpen={true} />);
      const nameInput = screen.getByLabelText(/certificate name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Certificate' } });
      
      // Close and reopen modal
      rerender(<CertificateModal {...mockProps} isOpen={false} />);
      rerender(<CertificateModal {...mockProps} isOpen={true} />);
      
      expect(screen.getByLabelText(/certificate name/i)).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    it('shows required field errors when submitting empty form', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /add certificate/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Certificate name is required')).toBeInTheDocument();
        expect(screen.getByText('Issuing organization is required')).toBeInTheDocument();
        expect(screen.getByText('Date issued is required')).toBeInTheDocument();
      });
    });

    it('clears errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /add certificate/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Certificate name is required')).toBeInTheDocument();
      });
      
      // Start typing to clear error
      const nameInput = screen.getByLabelText(/certificate name/i);
      await user.type(nameInput, 'Test');
      
      await waitFor(() => {
        expect(screen.queryByText('Certificate name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with correct data when form is valid', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/certificate name/i), 'Test Certificate');
      await user.type(screen.getByLabelText(/issuing organization/i), 'Test Organization');
      await user.type(screen.getByLabelText(/date issued/i), '2023-01-15');
      await user.type(screen.getByLabelText(/expiration date/i), '2025-01-15');
      await user.type(screen.getByLabelText(/verification url/i), 'https://verify.test.com');
      await user.type(screen.getByLabelText(/certificate image url/i), 'https://example.com/cert.jpg');
      
      const submitButton = screen.getByRole('button', { name: /add certificate/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith({
          name: 'Test Certificate',
          issuingOrganization: 'Test Organization',
          dateIssued: new Date('2023-01-15'),
          expirationDate: new Date('2025-01-15'),
          verificationUrl: 'https://verify.test.com',
          certificateImageUrl: 'https://example.com/cert.jpg'
        });
      });
    });

    it('calls onSave with undefined optional fields when empty', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      // Fill out only required fields
      await user.type(screen.getByLabelText(/certificate name/i), 'Test Certificate');
      await user.type(screen.getByLabelText(/issuing organization/i), 'Test Organization');
      await user.type(screen.getByLabelText(/date issued/i), '2023-01-15');
      
      const submitButton = screen.getByRole('button', { name: /add certificate/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith({
          name: 'Test Certificate',
          issuingOrganization: 'Test Organization',
          dateIssued: new Date('2023-01-15'),
          expirationDate: undefined,
          verificationUrl: undefined,
          certificateImageUrl: undefined
        });
      });
    });

    it('calls onClose after successful save', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      // Fill out required fields
      await user.type(screen.getByLabelText(/certificate name/i), 'Test Certificate');
      await user.type(screen.getByLabelText(/issuing organization/i), 'Test Organization');
      await user.type(screen.getByLabelText(/date issued/i), '2023-01-15');
      
      const submitButton = screen.getByRole('button', { name: /add certificate/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    it('shows "Update Certificate" button text when editing', () => {
      render(<CertificateModal {...mockProps} certificate={mockCertificate} />);
      
      expect(screen.getByRole('button', { name: /update certificate/i })).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const backdrop = screen.getByRole('dialog');
      await user.click(backdrop);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('does not close when modal content is clicked', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const modalTitle = screen.getByRole('heading', { name: /add certificate/i });
      await user.click(modalTitle);
      
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<CertificateModal {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'certificate-modal-title');
    });

    it('has proper form labels and descriptions', () => {
      render(<CertificateModal {...mockProps} />);
      
      expect(screen.getByLabelText(/certificate name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/issuing organization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date issued/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
      
      // Check help text
      expect(screen.getByText(/leave blank if the certificate doesn't expire/i)).toBeInTheDocument();
      expect(screen.getByText(/add a url where others can verify/i)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /add certificate/i });
      await user.click(submitButton);
      
      const nameInput = screen.getByLabelText(/certificate name/i);
      const errorMessage = screen.getByText('Certificate name is required');
      
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      expect(errorMessage).toHaveAttribute('id', 'name-error');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('has proper required field indicators', () => {
      render(<CertificateModal {...mockProps} />);
      
      // Check for required class on labels
      const requiredLabels = document.querySelectorAll('.form-label.required');
      expect(requiredLabels.length).toBeGreaterThan(0);
      
      const nameInput = screen.getByLabelText(/certificate name/i);
      const organizationInput = screen.getByLabelText(/issuing organization/i);
      const dateInput = screen.getByLabelText(/date issued/i);
      
      expect(nameInput).toHaveAttribute('required');
      expect(organizationInput).toHaveAttribute('required');
      expect(dateInput).toHaveAttribute('required');
    });
  });

  describe('Date Input Constraints', () => {
    it('sets max date for date issued to today', () => {
      render(<CertificateModal {...mockProps} />);
      
      const dateInput = screen.getByLabelText(/date issued/i);
      const today = new Date().toISOString().split('T')[0];
      
      expect(dateInput).toHaveAttribute('max', today);
    });

    it('sets min date for expiration based on issue date', async () => {
      const user = userEvent.setup();
      render(<CertificateModal {...mockProps} />);
      
      const dateIssuedInput = screen.getByLabelText(/date issued/i);
      const expirationInput = screen.getByLabelText(/expiration date/i);
      
      await user.type(dateIssuedInput, '2023-01-15');
      
      expect(expirationInput).toHaveAttribute('min', '2023-01-15');
    });
  });
});