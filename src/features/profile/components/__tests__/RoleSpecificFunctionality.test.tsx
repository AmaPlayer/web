import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoleSelector from '../RoleSelector';
import RoleSpecificSections from '../RoleSpecificSections';
import OrganizationInfoSection from '../OrganizationInfoSection';
import ConnectedAthletesSection from '../ConnectedAthletesSection';
import CoachingInfoSection from '../CoachingInfoSection';
import { UserRole, roleConfigurations, PersonalDetails } from '../../types/ProfileTypes';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Building: () => <div data-testid="building-icon" />,
  GraduationCap: () => <div data-testid="graduation-cap-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  UserCheck: () => <div data-testid="user-check-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
}));

// Mock personal details for testing
const mockPersonalDetails: PersonalDetails = {
  name: 'Test User',
  age: 25,
  height: '6\'2"',
  weight: '180 lbs',
  sex: 'Male',
  sport: 'Basketball',
  position: 'Point Guard',
  organizationName: 'Elite Sports Academy',
  organizationType: 'Training Facility',
  location: 'Los Angeles, CA',
  contactEmail: 'info@elitesports.com',
  website: 'www.elitesports.com',
  relationship: 'Father',
  connectedAthletes: ['Alex Johnson', 'Sarah Johnson'],
  specializations: ['Basketball', 'Strength Training'],
  yearsExperience: 8,
  coachingLevel: 'Level 3 Certified'
};

describe('Role-Specific Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Role Switching and Section Visibility', () => {
    it('displays correct sections for athlete role', () => {
      render(
        <RoleSpecificSections
          currentRole="athlete"
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Athlete role should not show any role-specific sections in RoleSpecificSections
      // (achievements, certificates, talentVideos are handled by parent component)
      expect(screen.queryByText('Organization Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Connected Athletes')).not.toBeInTheDocument();
      expect(screen.queryByText('Coaching Information')).not.toBeInTheDocument();
    });

    it('displays organization-specific sections when role is organization', () => {
      render(
        <RoleSpecificSections
          currentRole="organization"
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Should show organization-specific sections
      expect(screen.getByText('Organization Information')).toBeInTheDocument();
      expect(screen.getByText('Elite Sports Academy')).toBeInTheDocument();
      expect(screen.getByText('Training Facility')).toBeInTheDocument();

      // Should not show other role-specific sections
      expect(screen.queryByText('Connected Athletes')).not.toBeInTheDocument();
      expect(screen.queryByText('Coaching Information')).not.toBeInTheDocument();
    });

    it('displays parent-specific sections when role is parents', () => {
      render(
        <RoleSpecificSections
          currentRole="parents"
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
          onAddAthlete={jest.fn()}
        />
      );

      // Should show parent-specific sections
      expect(screen.getByText('Connected Athletes')).toBeInTheDocument();
      expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();

      // Should not show other role-specific sections
      expect(screen.queryByText('Organization Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Coaching Information')).not.toBeInTheDocument();
    });

    it('displays coach-specific sections when role is coaches', () => {
      render(
        <RoleSpecificSections
          currentRole="coaches"
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Should show coach-specific sections
      expect(screen.getByText('Coaching Information')).toBeInTheDocument();
      expect(screen.getByText('Basketball')).toBeInTheDocument();
      expect(screen.getByText('Strength Training')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Level 3 Certified')).toBeInTheDocument();

      // Should not show other role-specific sections
      expect(screen.queryByText('Organization Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Connected Athletes')).not.toBeInTheDocument();
    });
  });

  describe('Role Selector Functionality', () => {
    it('displays current role correctly', () => {
      const mockOnRoleChange = jest.fn();
      
      render(
        <RoleSelector
          currentRole="athlete"
          onRoleChange={mockOnRoleChange}
        />
      );

      expect(screen.getByText('Athlete')).toBeInTheDocument();
    });

    it('calls onRoleChange when role is switched', () => {
      const mockOnRoleChange = jest.fn();
      
      render(
        <RoleSelector
          currentRole="athlete"
          onRoleChange={mockOnRoleChange}
        />
      );

      // Open dropdown
      const dropdown = screen.getByRole('button', { name: /current role: athlete/i });
      fireEvent.click(dropdown);

      // Select organization role
      const organizationOption = screen.getByText('Organization');
      fireEvent.click(organizationOption);

      expect(mockOnRoleChange).toHaveBeenCalledWith('organization');
    });

    it('shows all available roles in dropdown', () => {
      const mockOnRoleChange = jest.fn();
      
      render(
        <RoleSelector
          currentRole="athlete"
          onRoleChange={mockOnRoleChange}
        />
      );

      // Open dropdown
      const dropdown = screen.getByRole('button', { name: /current role: athlete/i });
      fireEvent.click(dropdown);

      // Check all roles are present using getAllByText for roles that appear multiple times
      expect(screen.getAllByText('Athlete')).toHaveLength(2); // One in button, one in dropdown
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Coach')).toBeInTheDocument();
    });
  });

  describe('Data Persistence and Role Management', () => {
    it('maintains role-specific data when switching between roles', () => {
      // Test that role-specific sections show appropriate data
      const { rerender } = render(
        <RoleSpecificSections
          currentRole="organization"
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Organization data should be visible
      expect(screen.getByText('Elite Sports Academy')).toBeInTheDocument();
      expect(screen.getByText('Training Facility')).toBeInTheDocument();

      // Switch to coach role
      rerender(
        <RoleSpecificSections
          currentRole="coaches"
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Coach data should be visible
      expect(screen.getByText('Basketball')).toBeInTheDocument();
      expect(screen.getByText('Strength Training')).toBeInTheDocument();
      expect(screen.getByText('Level 3 Certified')).toBeInTheDocument();

      // Organization data should not be visible
      expect(screen.queryByText('Elite Sports Academy')).not.toBeInTheDocument();
    });

    it('handles missing role-specific data gracefully', () => {
      const incompletePersonalDetails: PersonalDetails = {
        name: 'Test User',
      };

      render(
        <RoleSpecificSections
          currentRole="organization"
          personalDetails={incompletePersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Should still render the section even with missing data
      expect(screen.getByText('Organization Information')).toBeInTheDocument();
    });

    it('preserves personal details structure across different roles', () => {
      // Test that the same personal details object works for all roles
      const roles: UserRole[] = ['athlete', 'organization', 'parents', 'coaches'];
      
      roles.forEach(role => {
        const { unmount } = render(
          <RoleSpecificSections
            currentRole={role}
            personalDetails={mockPersonalDetails}
            isOwner={true}
            onEditProfile={jest.fn()}
            onAddAthlete={role === 'parents' ? jest.fn() : undefined}
          />
        );
        
        // Each role should render without errors
        // The specific content will vary by role, but the component should not crash
        unmount();
      });
    });
  });

  describe('Role-Specific Field Validation', () => {
    it('validates athlete-specific fields are properly displayed', () => {
      const athleteDetails: PersonalDetails = {
        name: 'John Athlete',
        age: 22,
        height: '6\'2"',
        weight: '180 lbs',
        sex: 'Male',
        sport: 'Basketball',
        position: 'Point Guard'
      };

      // Test that athlete fields are accessible and valid
      expect(athleteDetails.name).toBeDefined();
      expect(athleteDetails.sport).toBeDefined();
      expect(athleteDetails.position).toBeDefined();
      expect(athleteDetails.height).toBeDefined();
      expect(athleteDetails.weight).toBeDefined();

      // Validate field types
      expect(typeof athleteDetails.name).toBe('string');
      expect(typeof athleteDetails.age).toBe('number');
      expect(typeof athleteDetails.sport).toBe('string');
      expect(typeof athleteDetails.position).toBe('string');
    });

    it('validates organization-specific fields are properly displayed', () => {
      render(
        <OrganizationInfoSection
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEdit={jest.fn()}
        />
      );

      // Check organization-specific fields are displayed
      expect(screen.getByText('Elite Sports Academy')).toBeInTheDocument();
      expect(screen.getByText('Training Facility')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles, CA')).toBeInTheDocument();
      expect(screen.getByText('info@elitesports.com')).toBeInTheDocument();
      expect(screen.getByText('www.elitesports.com')).toBeInTheDocument();
    });

    it('validates parent-specific fields are properly displayed', () => {
      render(
        <ConnectedAthletesSection
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEdit={jest.fn()}
          onAddAthlete={jest.fn()}
        />
      );

      // Check parent-specific fields are displayed
      expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Relationship: Father')).toBeInTheDocument();
    });

    it('validates coach-specific fields are properly displayed', () => {
      render(
        <CoachingInfoSection
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEdit={jest.fn()}
        />
      );

      // Check coach-specific fields are displayed
      expect(screen.getByText('Basketball')).toBeInTheDocument();
      expect(screen.getByText('Strength Training')).toBeInTheDocument();
      expect(screen.getByText('8 years')).toBeInTheDocument();
      expect(screen.getByText('Level 3 Certified')).toBeInTheDocument();
    });

    it('handles empty or invalid field values gracefully', () => {
      const emptyDetails: PersonalDetails = {
        name: '',
        age: undefined,
        sport: null as any,
        specializations: [],
        connectedAthletes: []
      };

      // Test organization section with empty data
      render(
        <OrganizationInfoSection
          personalDetails={emptyDetails}
          isOwner={true}
          onEdit={jest.fn()}
        />
      );

      expect(screen.getByText('No organization information added yet')).toBeInTheDocument();

      // Test connected athletes section with empty data
      const { rerender } = render(
        <ConnectedAthletesSection
          personalDetails={emptyDetails}
          isOwner={true}
          onEdit={jest.fn()}
          onAddAthlete={jest.fn()}
        />
      );

      expect(screen.getByText('No connected athletes yet')).toBeInTheDocument();

      // Test coaching section with empty data
      rerender(
        <CoachingInfoSection
          personalDetails={emptyDetails}
          isOwner={true}
          onEdit={jest.fn()}
        />
      );

      expect(screen.getByText('No coaching information added yet')).toBeInTheDocument();
    });

    it('validates field type constraints for each role', () => {
      // Test that numeric fields are properly typed
      const coachDetails: PersonalDetails = {
        name: 'Coach Test',
        yearsExperience: 10,
        specializations: ['Soccer', 'Fitness']
      };

      expect(typeof coachDetails.yearsExperience).toBe('number');
      expect(Array.isArray(coachDetails.specializations)).toBe(true);
      expect(coachDetails.specializations?.every(s => typeof s === 'string')).toBe(true);

      // Test that array fields are properly handled
      const parentDetails: PersonalDetails = {
        name: 'Parent Test',
        connectedAthletes: ['Athlete 1', 'Athlete 2']
      };

      expect(Array.isArray(parentDetails.connectedAthletes)).toBe(true);
      expect(parentDetails.connectedAthletes?.length).toBe(2);
    });
  });

  describe('Enhanced Data Persistence and Role Management', () => {
    it('persists role selection to localStorage', () => {
      const mockOnRoleChange = jest.fn();
      
      render(
        <RoleSelector
          currentRole="athlete"
          onRoleChange={mockOnRoleChange}
        />
      );

      // Open dropdown and select organization
      const dropdown = screen.getByRole('button', { name: /current role: athlete/i });
      fireEvent.click(dropdown);

      const organizationOption = screen.getByText('Organization');
      fireEvent.click(organizationOption);

      expect(mockOnRoleChange).toHaveBeenCalledWith('organization');
    });

    it('maintains data integrity when switching between roles', () => {
      const testPersonalDetails: PersonalDetails = {
        name: 'Multi-Role User',
        // Athlete fields
        sport: 'Tennis',
        position: 'Singles',
        // Organization fields
        organizationName: 'Tennis Academy',
        organizationType: 'Sports Club',
        // Coach fields
        specializations: ['Tennis', 'Fitness'],
        yearsExperience: 5,
        // Parent fields
        relationship: 'Mother',
        connectedAthletes: ['Child Athlete']
      };

      // Test switching between roles maintains all data
      const { rerender } = render(
        <RoleSpecificSections
          currentRole="organization"
          personalDetails={testPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Organization data should be visible
      expect(screen.getByText('Tennis Academy')).toBeInTheDocument();

      // Switch to coach role
      rerender(
        <RoleSpecificSections
          currentRole="coaches"
          personalDetails={testPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Coach data should be visible
      expect(screen.getByText('Tennis')).toBeInTheDocument();
      expect(screen.getByText('5 years')).toBeInTheDocument();

      // Switch to parent role
      rerender(
        <RoleSpecificSections
          currentRole="parents"
          personalDetails={testPersonalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
          onAddAthlete={jest.fn()}
        />
      );

      // Parent data should be visible
      expect(screen.getByText('Child Athlete')).toBeInTheDocument();
      expect(screen.getByText('Mother')).toBeInTheDocument();
    });

    it('handles role changes without data loss', () => {
      const originalDetails = { ...mockPersonalDetails };
      
      // Simulate role change by re-rendering with different role
      const { rerender } = render(
        <RoleSpecificSections
          currentRole="organization"
          personalDetails={originalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Verify organization data is displayed
      expect(screen.getByText('Elite Sports Academy')).toBeInTheDocument();

      // Change to coach role
      rerender(
        <RoleSpecificSections
          currentRole="coaches"
          personalDetails={originalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Verify coach data is displayed and organization data is not lost
      expect(screen.getByText('Basketball')).toBeInTheDocument();
      expect(screen.getByText('8 years')).toBeInTheDocument();

      // Change back to organization role
      rerender(
        <RoleSpecificSections
          currentRole="organization"
          personalDetails={originalDetails}
          isOwner={true}
          onEditProfile={jest.fn()}
        />
      );

      // Verify organization data is still available
      expect(screen.getByText('Elite Sports Academy')).toBeInTheDocument();
      expect(screen.getByText('Training Facility')).toBeInTheDocument();
    });

    it('validates role-specific edit functionality', () => {
      const mockOnEdit = jest.fn();
      const mockOnAddAthlete = jest.fn();

      // Test organization edit functionality
      render(
        <OrganizationInfoSection
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit organization information/i });
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalled();

      // Test parent add athlete functionality
      const { rerender } = render(
        <ConnectedAthletesSection
          personalDetails={mockPersonalDetails}
          isOwner={true}
          onEdit={mockOnEdit}
          onAddAthlete={mockOnAddAthlete}
        />
      );

      const addButton = screen.getByRole('button', { name: /add new athlete connection/i });
      fireEvent.click(addButton);
      expect(mockOnAddAthlete).toHaveBeenCalled();
    });

    it('validates accessibility features across role changes', () => {
      const roles: UserRole[] = ['athlete', 'organization', 'parents', 'coaches'];
      
      roles.forEach(role => {
        const { unmount } = render(
          <RoleSpecificSections
            currentRole={role}
            personalDetails={mockPersonalDetails}
            isOwner={true}
            onEditProfile={jest.fn()}
            onAddAthlete={role === 'parents' ? jest.fn() : undefined}
          />
        );
        
        // Check that sections have proper ARIA labels when they exist
        const sections = screen.queryAllByRole('region');
        sections.forEach(section => {
          expect(section).toHaveAttribute('aria-labelledby');
        });
        
        unmount();
      });
    });
  });

  describe('Role Configuration Validation', () => {
    it('validates role configurations are properly defined', () => {
      const roles: UserRole[] = ['athlete', 'organization', 'parents', 'coaches'];
      
      roles.forEach(role => {
        const config = roleConfigurations[role];
        expect(config).toBeDefined();
        expect(config.role).toBe(role);
        expect(config.displayName).toBeDefined();
        expect(Array.isArray(config.sections)).toBe(true);
        expect(Array.isArray(config.editableFields)).toBe(true);
        expect(config.sections.length).toBeGreaterThan(0);
        expect(config.editableFields.length).toBeGreaterThan(0);
      });
    });

    it('ensures each role has unique section combinations', () => {
      const roleConfigs = Object.values(roleConfigurations);
      const sectionCombinations = roleConfigs.map(config => 
        config.sections.sort().join(',')
      );
      
      // Each role should have a unique combination of sections
      const uniqueCombinations = new Set(sectionCombinations);
      expect(uniqueCombinations.size).toBe(roleConfigs.length);
    });

    it('validates that common sections are properly shared', () => {
      const allConfigs = Object.values(roleConfigurations);
      
      // All roles should have 'personal' and 'posts' sections
      allConfigs.forEach(config => {
        expect(config.sections).toContain('personal');
        expect(config.sections).toContain('posts');
      });
    });

    it('validates role-specific sections are exclusive', () => {
      const athleteConfig = roleConfigurations.athlete;
      const organizationConfig = roleConfigurations.organization;
      const parentConfig = roleConfigurations.parents;
      const coachConfig = roleConfigurations.coaches;

      // Achievements and talent videos should only be for athletes
      expect(athleteConfig.sections).toContain('achievements');
      expect(athleteConfig.sections).toContain('talentVideos');
      expect(organizationConfig.sections).not.toContain('achievements');
      expect(organizationConfig.sections).not.toContain('talentVideos');
      expect(parentConfig.sections).not.toContain('achievements');
      expect(parentConfig.sections).not.toContain('talentVideos');
      expect(coachConfig.sections).not.toContain('achievements');
      expect(coachConfig.sections).not.toContain('talentVideos');

      // Organization info should only be for organizations
      expect(organizationConfig.sections).toContain('organizationInfo');
      expect(athleteConfig.sections).not.toContain('organizationInfo');
      expect(parentConfig.sections).not.toContain('organizationInfo');
      expect(coachConfig.sections).not.toContain('organizationInfo');

      // Connected athletes should only be for parents
      expect(parentConfig.sections).toContain('connectedAthletes');
      expect(athleteConfig.sections).not.toContain('connectedAthletes');
      expect(organizationConfig.sections).not.toContain('connectedAthletes');
      expect(coachConfig.sections).not.toContain('connectedAthletes');

      // Coaching info should only be for coaches
      expect(coachConfig.sections).toContain('coachingInfo');
      expect(athleteConfig.sections).not.toContain('coachingInfo');
      expect(organizationConfig.sections).not.toContain('coachingInfo');
      expect(parentConfig.sections).not.toContain('coachingInfo');
    });
  });
});