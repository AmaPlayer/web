import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementsSection from '../AchievementsSection';
import { Achievement } from '../../types/ProfileTypes';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon" />,
  Medal: () => <div data-testid="medal-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />
}));

describe('AchievementsSection', () => {
  const mockOnAddAchievement = jest.fn();
  const mockOnEditAchievement = jest.fn();
  const mockOnDeleteAchievement = jest.fn();

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'Swimming Championship',
      description: 'First place',
      dateEarned: new Date('2023-06-15'),
      category: 'Championship',
      verificationStatus: 'verified'
    },
    {
      id: '2',
      title: 'Track Meet',
      description: 'Second place',
      dateEarned: new Date('2023-05-20'),
      category: 'Competition',
      verificationStatus: 'pending'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays empty state when no achievements', () => {
    render(<AchievementsSection achievements={[]} isOwner={true} />);
    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
  });

  it('displays achievements list', () => {
    render(<AchievementsSection achievements={mockAchievements} isOwner={false} />);
    expect(screen.getByText('Swimming Championship')).toBeInTheDocument();
    expect(screen.getByText('Track Meet')).toBeInTheDocument();
  });

  it('sorts achievements by date (most recent first)', () => {
    render(<AchievementsSection achievements={mockAchievements} isOwner={false} />);
    const cards = screen.getAllByRole('listitem');
    expect(cards[0]).toHaveTextContent('Swimming Championship'); // June 2023
    expect(cards[1]).toHaveTextContent('Track Meet'); // May 2023
  });

  it('shows add button for owners', () => {
    render(<AchievementsSection achievements={mockAchievements} isOwner={true} onAddAchievement={mockOnAddAchievement} />);
    expect(screen.getByText('Add Achievement')).toBeInTheDocument();
  });

  it('calls onAddAchievement when add button clicked', () => {
    render(<AchievementsSection achievements={[]} isOwner={true} onAddAchievement={mockOnAddAchievement} />);
    fireEvent.click(screen.getByText('Add Your First Achievement'));
    expect(mockOnAddAchievement).toHaveBeenCalled();
  });

  it('shows edit/delete buttons for owners', () => {
    render(
      <AchievementsSection 
        achievements={mockAchievements} 
        isOwner={true} 
        onEditAchievement={mockOnEditAchievement}
        onDeleteAchievement={mockOnDeleteAchievement}
      />
    );
    expect(screen.getAllByTestId('edit-icon')).toHaveLength(2);
    expect(screen.getAllByTestId('trash-icon')).toHaveLength(2);
  });
});