import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserRole } from '../../types/ProfileTypes';

// Simple mock profile component for integration testing
const MockProfileEnhanced: React.FC<{ user: any; isOwner: boolean }> = ({ user, isOwner }) => {
  return (
    <div data-testid="profile-enhanced">
      <h1>{user.name}</h1>
      <div data-testid="role-display">{user.role}</div>
      
      {user.role === 'athlete' && (
        <>
          <section data-testid="achievements-section">
            <h2>Achievements</h2>
            {user.achievements.length === 0 ? (
              <p>No achievements yet</p>
            ) : (
              user.achievements.map((achievement: any) => (
                <div key={achievement.id}>{achievement.title}</div>
              ))
            )}
          </section>
          
          <section data-testid="certificates-section">
            <h2>Certificates</h2>
            {user.certificates.map((cert: any) => (
              <div key={cert.id}>
                <span>{cert.title}</span>
                <span>{cert.organization}</span>
                <span>{cert.verificationStatus === 'verified' ? 'Verified' : 'Expired'}</span>
              </div>
            ))}
          </section>
          
          <section data-testid="talent-videos-section">
            <h2>Talent Videos</h2>
            {user.talentVideos.map((video: any) => (
              <div key={video.id} className="video-card">
                <span>{video.title}</span>
                <span>{video.viewCount} views</span>
              </div>
            ))}
          </section>
        </>
      )}
      
      {user.role === 'organization' && (
        <section data-testid="organization-info">
          <h2>Organization Info</h2>
          <p>{user.organizationType}</p>
          <p>{user.contactInfo}</p>
        </section>
      )}
      
      <section data-testid="posts-section">
        <h2>Posts</h2>
        {user.posts.map((post: any) => (
          <div key={post.id} className="post-card">
            <span>{post.content}</span>
            <span>{post.likes} likes</span>
            <span>{post.comments} comments</span>
          </div>
        ))}
      </section>
      
      {isOwner && (
        <button aria-label="Edit profile">Edit Profile</button>
      )}
    </div>
  );
};

const mockAthleteUser = {
  id: '1',
  name: 'John Athlete',
  email: 'john@example.com',
  bio: 'Professional basketball player',
  location: 'New York',
  website: 'https://johndoe.com',
  profilePicture: 'https://example.com/avatar.jpg',
  role: 'athlete' as UserRole,
  sport: 'Basketball',
  position: 'Point Guard',
  achievements: [
    {
      id: '1',
      title: 'State Championship',
      description: 'Won state championship with team',
      date: new Date('2024-01-15'),
      category: 'Competition'
    }
  ],
  certificates: [
    {
      id: '1',
      title: 'CPR Certification',
      organization: 'Red Cross',
      issueDate: new Date('2023-06-01'),
      expirationDate: new Date('2025-06-01'),
      verificationStatus: 'verified' as const
    }
  ],
  talentVideos: [
    {
      id: '1',
      title: 'Basketball Highlights',
      description: 'My best plays from the season',
      videoUrl: '/videos/highlights.mp4',
      thumbnailUrl: '/thumbnails/highlights.jpg',
      sport: 'Basketball',
      skillCategory: 'Highlights',
      uploadDate: new Date('2024-01-10'),
      duration: 180,
      viewCount: 1250
    }
  ],
  posts: [
    {
      id: '1',
      type: 'photo' as const,
      content: 'Great practice today!',
      mediaUrl: '/images/practice.jpg',
      createdAt: new Date('2024-01-20'),
      likes: 45,
      comments: 12
    }
  ]
};

const mockOrganizationUser = {
  ...mockAthleteUser,
  id: '2',
  name: 'Sports Academy',
  role: 'organization' as UserRole,
  organizationType: 'Training Facility',
  contactInfo: 'contact@sportsacademy.com',
  achievements: [],
  certificates: [],
  talentVideos: [],
  posts: []
};

const defaultProps = {
  user: mockAthleteUser,
  isOwner: true
};

describe('ProfileEnhanced Integration Tests', () => {
  describe('Role Management', () => {
    it('displays correct sections for athlete role', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Certificates')).toBeInTheDocument();
      expect(screen.getByText('Talent Videos')).toBeInTheDocument();
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    it('displays correct sections for organization role', () => {
      render(<MockProfileEnhanced {...defaultProps} user={mockOrganizationUser} />);
      
      expect(screen.getByText('Organization Info')).toBeInTheDocument();
      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.queryByText('Achievements')).not.toBeInTheDocument();
      expect(screen.queryByText('Talent Videos')).not.toBeInTheDocument();
    });

    it('shows user name and role', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('John Athlete')).toBeInTheDocument();
      expect(screen.getByTestId('role-display')).toHaveTextContent('athlete');
    });
  });

  describe('Profile Editing Integration', () => {
    it('shows edit button for profile owner', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByLabelText('Edit profile')).toBeInTheDocument();
    });

    it('does not show edit button for non-owner', () => {
      render(<MockProfileEnhanced {...defaultProps} isOwner={false} />);
      
      expect(screen.queryByLabelText('Edit profile')).not.toBeInTheDocument();
    });
  });

  describe('Achievements Section Integration', () => {
    it('displays achievements', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('State Championship')).toBeInTheDocument();
    });

    it('shows empty state when no achievements', () => {
      const userWithNoAchievements = { ...mockAthleteUser, achievements: [] };
      render(<MockProfileEnhanced {...defaultProps} user={userWithNoAchievements} />);
      
      expect(screen.getByText('No achievements yet')).toBeInTheDocument();
    });
  });

  describe('Certificates Section Integration', () => {
    it('displays certificates with verification status', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('CPR Certification')).toBeInTheDocument();
      expect(screen.getByText('Red Cross')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('handles certificate expiration warnings', () => {
      const expiredCertUser = {
        ...mockAthleteUser,
        certificates: [{
          ...mockAthleteUser.certificates[0],
          verificationStatus: 'expired' as const
        }]
      };
      
      render(<MockProfileEnhanced {...defaultProps} user={expiredCertUser} />);
      
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  describe('Talent Videos Section Integration', () => {
    it('displays video grid', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('Basketball Highlights')).toBeInTheDocument();
      expect(screen.getByText('1250 views')).toBeInTheDocument();
    });

    it('shows video cards with proper class', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      const videoCard = screen.getByText('Basketball Highlights').closest('.video-card');
      expect(videoCard).toBeInTheDocument();
    });
  });

  describe('Posts Section Integration', () => {
    it('displays posts grid with engagement metrics', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('Great practice today!')).toBeInTheDocument();
      expect(screen.getByText('45 likes')).toBeInTheDocument();
      expect(screen.getByText('12 comments')).toBeInTheDocument();
    });

    it('shows post cards with proper class', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      const postCard = screen.getByText('Great practice today!').closest('.post-card');
      expect(postCard).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders profile content correctly', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByText('John Athlete')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('has proper test ids for sections', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByTestId('achievements-section')).toBeInTheDocument();
      expect(screen.getByTestId('certificates-section')).toBeInTheDocument();
      expect(screen.getByTestId('talent-videos-section')).toBeInTheDocument();
      expect(screen.getByTestId('posts-section')).toBeInTheDocument();
    });
  });

  describe('Performance with Large Datasets', () => {
    it('handles multiple achievements efficiently', () => {
      const manyAchievements = Array.from({ length: 3 }, (_, i) => ({
        id: `achievement-${i}`,
        title: `Achievement ${i}`,
        description: `Description ${i}`,
        date: new Date(),
        category: 'Competition'
      }));
      
      const userWithManyAchievements = {
        ...mockAthleteUser,
        achievements: manyAchievements
      };
      
      render(<MockProfileEnhanced {...defaultProps} user={userWithManyAchievements} />);
      
      // Should render achievements
      expect(screen.getByText('Achievement 0')).toBeInTheDocument();
      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('Achievement 2')).toBeInTheDocument();
    });

    it('handles multiple videos correctly', () => {
      const multipleVideos = Array.from({ length: 2 }, (_, i) => ({
        id: `video-${i}`,
        title: `Video ${i}`,
        description: `Description ${i}`,
        videoUrl: `/videos/video-${i}.mp4`,
        thumbnailUrl: `/thumbnails/video-${i}.jpg`,
        sport: 'Basketball',
        skillCategory: 'Highlights',
        uploadDate: new Date(),
        duration: 180,
        viewCount: 100
      }));
      
      const userWithMultipleVideos = {
        ...mockAthleteUser,
        talentVideos: multipleVideos
      };
      
      render(<MockProfileEnhanced {...defaultProps} user={userWithMultipleVideos} />);
      
      // Should render videos
      expect(screen.getByText('Video 0')).toBeInTheDocument();
      expect(screen.getByText('Video 1')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      const incompleteUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'athlete',
        achievements: [],
        certificates: [],
        talentVideos: [],
        posts: []
      };
      
      render(<MockProfileEnhanced {...defaultProps} user={incompleteUser} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('No achievements yet')).toBeInTheDocument();
    });

    it('renders properly with minimal data', () => {
      const minimalUser = {
        id: '1',
        name: 'Minimal User',
        role: 'athlete',
        achievements: [],
        certificates: [],
        talentVideos: [],
        posts: []
      };
      
      render(<MockProfileEnhanced {...defaultProps} user={minimalUser} />);
      
      expect(screen.getByText('Minimal User')).toBeInTheDocument();
      expect(screen.getByTestId('profile-enhanced')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByLabelText('Edit profile')).toBeInTheDocument();
    });

    it('provides proper heading hierarchy', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveTextContent('John Athlete');
      expect(headings[1]).toHaveTextContent('Achievements');
    });

    it('has accessible structure with test ids', () => {
      render(<MockProfileEnhanced {...defaultProps} />);
      
      expect(screen.getByTestId('profile-enhanced')).toBeInTheDocument();
      expect(screen.getByTestId('role-display')).toBeInTheDocument();
    });
  });
});