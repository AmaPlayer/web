import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementModal from '../AchievementModal';
import { Achievement } from '../../types/ProfileTypes';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  FileText: () => <div data-testid="file-text-icon" />
}));

describe('AchievementModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const mockAchievement: Achievement = {
    id: '1',
    title: 'Swimming Championship',
    description: 'First place',
    dateEarned: new Date('2023-06-15'),
    category: 'Championship',
    imageUrl: 'https://example.com/medal.jpg',
    verificationStatus: 'verified'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<AchievementModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<AchievementModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Achievement' })).toBeInTheDocument();
  });

  it('shows edit mode when achievement provided', () => {
    render(<AchievementModal isOpen={true} achievement={mockAchievement} onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('Edit Achievement')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Swimming Championship')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', () => {
    render(<AchievementModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    fireEvent.click(screen.getByRole('button', { name: /add achievement/i }));
    expect(screen.getByText('Achievement title is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
  });

  it('calls onSave with form data when submitted', () => {
    render(<AchievementModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Achievement' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Championship' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2023-06-15' } });
    
    fireEvent.click(screen.getByRole('button', { name: /add achievement/i }));
    
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Achievement',
      category: 'Championship',
      dateEarned: new Date('2023-06-15')
    }));
  });

  it('calls onClose when cancel clicked', () => {
    render(<AchievementModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows character counter for description', () => {
    render(<AchievementModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('0/500 characters')).toBeInTheDocument();
  });
});