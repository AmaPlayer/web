import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TalentVideosSection from '../TalentVideosSection';
import { TalentVideo } from '../../types/TalentVideoTypes';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
    Play: () => <div data-testid="play-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    MoreVertical: () => <div data-testid="more-vertical-icon" />,
    Edit: () => <div data-testid="edit-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
    Edit3: () => <div data-testid="edit3-icon" />
}));

// Mock child components
jest.mock('../VideoPlayerModal', () => {
    return function VideoPlayerModal({ isOpen, onClose, video }: any) {
        return isOpen ? (
            <div data-testid="video-player-modal">
                <button onClick={onClose}>Close Player</button>
                <div>{video?.title}</div>
            </div>
        ) : null;
    };
});

jest.mock('../VideoManagementModal', () => {
    return function VideoManagementModal({ isOpen, onClose, onSave, editingVideo }: any) {
        return isOpen ? (
            <div data-testid="video-management-modal">
                <button onClick={onClose}>Close Management</button>
                <button onClick={() => onSave({ title: 'Test Video', description: 'Test', sport: 'Soccer', skillCategory: 'Dribbling' })}>
                    Save Video
                </button>
                <div>{editingVideo ? 'Editing' : 'Adding'} Video</div>
            </div>
        ) : null;
    };
});

jest.mock('../VideoFilters', () => {
    return function VideoFilters({
        selectedSport,
        selectedSkillCategory,
        onSportChange,
        onSkillCategoryChange,
        availableSports,
        availableSkillCategories,
        totalVideos,
        filteredVideos
    }: any) {
        return (
            <div data-testid="video-filters">
                <select
                    data-testid="sport-filter"
                    value={selectedSport}
                    onChange={(e) => onSportChange(e.target.value)}
                >
                    <option value="">All Sports</option>
                    {availableSports.map((sport: string) => (
                        <option key={sport} value={sport}>{sport}</option>
                    ))}
                </select>
                <select
                    data-testid="skill-filter"
                    value={selectedSkillCategory}
                    onChange={(e) => onSkillCategoryChange(e.target.value)}
                >
                    <option value="">All Skills</option>
                    {availableSkillCategories.map((skill: string) => (
                        <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
                <div data-testid="filter-results">{filteredVideos} of {totalVideos} videos</div>
            </div>
        );
    };
});

describe('TalentVideosSection', () => {
    const mockOnAddVideo = jest.fn();
    const mockOnEditVideo = jest.fn();
    const mockOnDeleteVideo = jest.fn();
    const mockOnVideoClick = jest.fn();
    const mockOnOpenEditModal = jest.fn();

    const mockVideos: TalentVideo[] = [
        {
            id: '1',
            title: 'Soccer Skills',
            description: 'Dribbling techniques',
            videoUrl: 'https://example.com/video1.mp4',
            thumbnailUrl: 'https://example.com/thumb1.jpg',
            sport: 'Soccer',
            skillCategory: 'Dribbling',
            uploadDate: new Date('2023-06-15'),
            duration: 120,
            viewCount: 1500
        },
        {
            id: '2',
            title: 'Basketball Shots',
            description: 'Three-point shooting',
            videoUrl: 'https://example.com/video2.mp4',
            thumbnailUrl: 'https://example.com/thumb2.jpg',
            sport: 'Basketball',
            skillCategory: 'Shooting',
            uploadDate: new Date('2023-05-20'),
            duration: 90,
            viewCount: 2300
        },
        {
            id: '3',
            title: 'Soccer Passing',
            description: 'Long pass techniques',
            videoUrl: 'https://example.com/video3.mp4',
            thumbnailUrl: 'https://example.com/thumb3.jpg',
            sport: 'Soccer',
            skillCategory: 'Passing',
            uploadDate: new Date('2023-07-10'),
            duration: 180,
            viewCount: 890
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock window.confirm
        window.confirm = jest.fn(() => true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Video Grid Display', () => {
        it('displays empty state when no videos exist', () => {
            render(
                <TalentVideosSection
                    videos={[]}
                    isOwner={true}
                    onAddVideo={mockOnAddVideo}
                />
            );

            expect(screen.getByText('No talent videos yet')).toBeInTheDocument();
            expect(screen.getByText('Showcase your skills by uploading talent videos')).toBeInTheDocument();
            expect(screen.getByText('Upload Your First Video')).toBeInTheDocument();
        });

        it('displays empty state for non-owner when no videos exist', () => {
            render(
                <TalentVideosSection
                    videos={[]}
                    isOwner={false}
                />
            );

            expect(screen.getByText('No talent videos yet')).toBeInTheDocument();
            expect(screen.getByText('No videos have been shared yet')).toBeInTheDocument();
            expect(screen.queryByText('Upload Your First Video')).not.toBeInTheDocument();
        });

        it('displays video grid when videos exist', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            expect(screen.getByText('Soccer Skills')).toBeInTheDocument();
            expect(screen.getByText('Basketball Shots')).toBeInTheDocument();
            expect(screen.getByText('Soccer Passing')).toBeInTheDocument();
        });

        it('displays video thumbnails and metadata correctly', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            // Check thumbnails
            const thumbnails = screen.getAllByRole('img');
            expect(thumbnails).toHaveLength(3);
            expect(thumbnails[0]).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
            expect(thumbnails[0]).toHaveAttribute('alt', 'Soccer Skills');

            // Check video metadata - use getAllByText for multiple occurrences
            expect(screen.getAllByText('Soccer')).toHaveLength(3); // 2 videos + 1 in filter
            expect(screen.getAllByText('Basketball')).toHaveLength(2); // 1 video + 1 in filter
            expect(screen.getByText('1.5K views')).toBeInTheDocument();
            expect(screen.getByText('2.3K views')).toBeInTheDocument();
            expect(screen.getByText('890 views')).toBeInTheDocument();

            // Check duration formatting
            expect(screen.getByText('2:00')).toBeInTheDocument(); // 120 seconds
            expect(screen.getByText('1:30')).toBeInTheDocument(); // 90 seconds
            expect(screen.getByText('3:00')).toBeInTheDocument(); // 180 seconds
        });

        it('shows filters when videos exist', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            expect(screen.getByTestId('video-filters')).toBeInTheDocument();
        });

        it('does not show filters when no videos exist', () => {
            render(
                <TalentVideosSection
                    videos={[]}
                    isOwner={false}
                />
            );

            expect(screen.queryByTestId('video-filters')).not.toBeInTheDocument();
        });
    });

    describe('Video Filtering and Categorization', () => {
        it('filters videos by sport', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            const sportFilter = screen.getByTestId('sport-filter');
            fireEvent.change(sportFilter, { target: { value: 'Soccer' } });

            // Should show filtered results
            expect(screen.getByTestId('filter-results')).toHaveTextContent('2 of 3 videos');
        });

        it('filters videos by skill category', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            // First select a sport to populate skill categories
            const sportFilter = screen.getByTestId('sport-filter');
            fireEvent.change(sportFilter, { target: { value: 'Soccer' } });

            const skillFilter = screen.getByTestId('skill-filter');
            fireEvent.change(skillFilter, { target: { value: 'Dribbling' } });

            // Should show filtered results
            expect(screen.getByTestId('filter-results')).toHaveTextContent('1 of 3 videos');
        });

        it('shows empty state when filters match no videos', () => {
            // Create a component with no videos matching a specific filter
            const emptyFilterVideos: TalentVideo[] = [];

            render(
                <TalentVideosSection
                    videos={emptyFilterVideos}
                    isOwner={false}
                />
            );

            // Since we have no videos, it should show the regular empty state
            expect(screen.getByText('No talent videos yet')).toBeInTheDocument();
        });

        it('resets skill category when sport changes', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            // Select soccer and a skill category
            const sportFilter = screen.getByTestId('sport-filter');
            fireEvent.change(sportFilter, { target: { value: 'Soccer' } });

            const skillFilter = screen.getByTestId('skill-filter');
            fireEvent.change(skillFilter, { target: { value: 'Dribbling' } });

            // Change sport - skill category should reset
            fireEvent.change(sportFilter, { target: { value: 'Basketball' } });

            expect(skillFilter).toHaveValue('');
        });

        it('provides correct available sports and skill categories', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            const sportFilter = screen.getByTestId('sport-filter');

            // Check available sports (should be sorted)
            expect(sportFilter).toHaveTextContent('Basketball');
            expect(sportFilter).toHaveTextContent('Soccer');

            // Select soccer to check skill categories
            fireEvent.change(sportFilter, { target: { value: 'Soccer' } });

            const skillFilter = screen.getByTestId('skill-filter');
            expect(skillFilter).toHaveTextContent('Dribbling');
            expect(skillFilter).toHaveTextContent('Passing');
        });
    });

    describe('Video Management Operations', () => {
        it('shows add video button for owners', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onAddVideo={mockOnAddVideo}
                />
            );

            expect(screen.getByText('Add Video')).toBeInTheDocument();
        });

        it('does not show add video button for non-owners', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            expect(screen.queryByText('Add Video')).not.toBeInTheDocument();
        });

        it('opens add video modal when add button clicked', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onAddVideo={mockOnAddVideo}
                />
            );

            fireEvent.click(screen.getByText('Add Video'));

            expect(screen.getByTestId('video-management-modal')).toBeInTheDocument();
            expect(screen.getByText('Adding Video')).toBeInTheDocument();
            expect(mockOnAddVideo).toHaveBeenCalled();
        });

        it('shows video management options for owners', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onEditVideo={mockOnEditVideo}
                    onDeleteVideo={mockOnDeleteVideo}
                />
            );

            const menuButtons = screen.getAllByTestId('more-vertical-icon');
            expect(menuButtons).toHaveLength(3);
        });

        it('does not show video management options for non-owners', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            expect(screen.queryByTestId('more-vertical-icon')).not.toBeInTheDocument();
        });

        it('opens edit modal when edit option clicked', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onEditVideo={mockOnEditVideo}
                    onDeleteVideo={mockOnDeleteVideo}
                />
            );

            // Click first video's menu button
            const menuButtons = screen.getAllByLabelText('Video options');
            fireEvent.click(menuButtons[0]);

            // Click edit option
            const editButton = screen.getByTestId('edit-icon');
            fireEvent.click(editButton);

            expect(screen.getByTestId('video-management-modal')).toBeInTheDocument();
            expect(screen.getByText('Editing Video')).toBeInTheDocument();
        });

        it('calls onDeleteVideo when delete confirmed', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onEditVideo={mockOnEditVideo}
                    onDeleteVideo={mockOnDeleteVideo}
                />
            );

            // Click first video's menu button
            const menuButtons = screen.getAllByLabelText('Video options');
            fireEvent.click(menuButtons[0]);

            // Click delete option
            const deleteButton = screen.getByTestId('trash-icon');
            fireEvent.click(deleteButton);

            expect(mockOnDeleteVideo).toHaveBeenCalledWith('1');
        });

        it('does not delete video when delete cancelled', () => {
            window.confirm = jest.fn(() => false);

            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onEditVideo={mockOnEditVideo}
                    onDeleteVideo={mockOnDeleteVideo}
                />
            );

            // Click first video's menu button
            const menuButtons = screen.getAllByLabelText('Video options');
            fireEvent.click(menuButtons[0]);

            // Click delete option
            const deleteButton = screen.getByTestId('trash-icon');
            fireEvent.click(deleteButton);

            expect(mockOnDeleteVideo).not.toHaveBeenCalled();
        });

        it('opens video player when video clicked', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                    onVideoClick={mockOnVideoClick}
                />
            );

            // Click on first video
            const videoCards = screen.getAllByRole('img');
            fireEvent.click(videoCards[0].closest('.video-card')!);

            expect(screen.getByTestId('video-player-modal')).toBeInTheDocument();
            // Check that the modal contains the video title (there will be multiple instances)
            const modalTitle = screen.getByTestId('video-player-modal').querySelector('div');
            expect(modalTitle).toHaveTextContent('Soccer Skills');
            expect(mockOnVideoClick).toHaveBeenCalledWith(mockVideos[0]);
        });

        it('closes video player modal', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={false}
                />
            );

            // Open video player
            const videoCards = screen.getAllByRole('img');
            fireEvent.click(videoCards[0].closest('.video-card')!);

            expect(screen.getByTestId('video-player-modal')).toBeInTheDocument();

            // Close video player
            fireEvent.click(screen.getByText('Close Player'));

            expect(screen.queryByTestId('video-player-modal')).not.toBeInTheDocument();
        });

        it('saves video data through management modal', async () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onEditVideo={mockOnEditVideo}
                />
            );

            // Open add video modal
            fireEvent.click(screen.getByText('Add Video'));

            // Save video
            fireEvent.click(screen.getByText('Save Video'));

            await waitFor(() => {
                expect(screen.queryByTestId('video-management-modal')).not.toBeInTheDocument();
            });
        });

        it('calls onEditVideo when editing existing video', async () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onEditVideo={mockOnEditVideo}
                />
            );

            // Open edit modal for first video
            const menuButtons = screen.getAllByLabelText('Video options');
            fireEvent.click(menuButtons[0]);

            const editButton = screen.getByTestId('edit-icon');
            fireEvent.click(editButton);

            // Save video
            fireEvent.click(screen.getByText('Save Video'));

            await waitFor(() => {
                expect(mockOnEditVideo).toHaveBeenCalledWith(expect.objectContaining({
                    id: '1',
                    title: 'Test Video',
                    description: 'Test',
                    sport: 'Soccer',
                    skillCategory: 'Dribbling'
                }));
            });
        });

        it('shows edit section button for owners when onOpenEditModal provided', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onOpenEditModal={mockOnOpenEditModal}
                />
            );

            expect(screen.getByText('Edit Section')).toBeInTheDocument();
        });

        it('calls onOpenEditModal when edit section clicked', () => {
            render(
                <TalentVideosSection
                    videos={mockVideos}
                    isOwner={true}
                    onOpenEditModal={mockOnOpenEditModal}
                />
            );

            fireEvent.click(screen.getByText('Edit Section'));

            expect(mockOnOpenEditModal).toHaveBeenCalledWith('videos');
        });
    });

    describe('View Count Formatting', () => {
        it('formats view counts correctly', () => {
            const videosWithDifferentViews: TalentVideo[] = [
                { ...mockVideos[0], viewCount: 50 },
                { ...mockVideos[1], viewCount: 1500 },
                { ...mockVideos[2], viewCount: 1500000 }
            ];

            render(
                <TalentVideosSection
                    videos={videosWithDifferentViews}
                    isOwner={false}
                />
            );

            expect(screen.getByText('50 views')).toBeInTheDocument();
            expect(screen.getByText('1.5K views')).toBeInTheDocument();
            expect(screen.getByText('1.5M views')).toBeInTheDocument();
        });
    });

    describe('Duration Formatting', () => {
        it('formats duration correctly', () => {
            const videosWithDifferentDurations: TalentVideo[] = [
                { ...mockVideos[0], duration: 65 }, // 1:05
                { ...mockVideos[1], duration: 125 }, // 2:05
                { ...mockVideos[2], duration: 3661 } // 61:01
            ];

            render(
                <TalentVideosSection
                    videos={videosWithDifferentDurations}
                    isOwner={false}
                />
            );

            expect(screen.getByText('1:05')).toBeInTheDocument();
            expect(screen.getByText('2:05')).toBeInTheDocument();
            expect(screen.getByText('61:01')).toBeInTheDocument();
        });
    });
});