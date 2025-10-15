import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3 } from 'lucide-react';
import FooterNav from '../../../components/layout/FooterNav';
import RoleSelector from '../components/RoleSelector';
import AchievementsSection from '../components/AchievementsSection';
import CertificatesSection from '../components/CertificatesSection';
import RoleSpecificSections from '../components/RoleSpecificSections';
import AchievementModal from '../components/AchievementModal';
import CertificateModal from '../components/CertificateModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditProfileModal, { EditProfileData } from '../components/EditProfileModal';
import { UserRole, PersonalDetails, ProfileEnhancedState, roleConfigurations, Achievement, Certificate } from '../types/ProfileTypes';
import { TalentVideo } from '../types/TalentVideoTypes';
import '../styles/Profile.css';
import '../styles/ProfileEnhanced.css';

const ProfileEnhanced: React.FC = () => {
  const navigate = useNavigate();

  // Initialize state with default values
  const [profileState, setProfileState] = useState<ProfileEnhancedState>({
    currentRole: 'athlete',
    isEditing: false,
    editingSection: null,
    achievements: [],
    certificates: [],
    talentVideos: [],
    posts: [],
    personalDetails: {
      name: 'baboo yogi',
      dateOfBirth: '1999-05-15',
      gender: 'Male',
      mobile: '+1234567890',
      email: 'baboo@example.com',
      city: 'Los Angeles',
      district: 'Central LA',
      state: 'California',
      playerType: 'Professional',
      sport: 'Basketball',
      position: 'Point Guard',
      // Organization-specific fields
      organizationName: 'Elite Sports Academy',
      organizationType: 'Training Facility',
      location: 'Los Angeles, CA',
      contactEmail: 'info@elitesports.com',
      website: 'www.elitesports.com',
      // Parent-specific fields
      relationship: 'Father',
      connectedAthletes: ['Alex Johnson', 'Sarah Johnson'],
      // Coach-specific fields
      specializations: ['Basketball', 'Strength Training', 'Youth Development'],
      yearsExperience: 8,
      coachingLevel: 'Level 3 Certified'
    },
    physicalAttributes: {
      height: 188, // cm
      weight: 82, // kg
      dominantSide: 'Right',
      personalBest: '32 points',
      seasonBest: '28 points avg',
      coachName: 'John Smith',
      coachContact: '+1987654321',
      trainingAcademy: 'Elite Basketball Academy',
      schoolName: 'LA Sports High',
      clubName: 'Lakers Youth'
    }
  });

  // Modal states
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAchievementId, setDeletingAchievementId] = useState<string | null>(null);
  const [deletingCertificateId, setDeletingCertificateId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'achievement' | 'certificate'>('achievement');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState<'personal' | 'achievements' | 'certificates' | 'videos' | 'posts' | 'organization' | 'coaching' | 'parent'>('personal');

  // Load saved role from localStorage on component mount
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (savedRole && roleConfigurations[savedRole]) {
      setProfileState(prev => ({
        ...prev,
        currentRole: savedRole
      }));
    }
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setProfileState(prev => ({
      ...prev,
      currentRole: newRole
    }));
    
    // Persist role selection to localStorage
    localStorage.setItem('userRole', newRole);
  };

  const handleEditProfile = (section: 'personal' | 'achievements' | 'certificates' | 'videos' | 'posts' | 'organization' | 'coaching' | 'parent' = 'personal') => {
    setEditModalInitialTab(section);
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = (data: EditProfileData) => {
    setProfileState(prev => ({
      ...prev,
      personalDetails: data.personalDetails,
      physicalAttributes: data.physicalAttributes,
      achievements: data.achievements,
      certificates: data.certificates,
      talentVideos: data.talentVideos,
      posts: data.posts
    }));
    setIsEditProfileModalOpen(false);
  };

  const handleCloseEditProfile = () => {
    setIsEditProfileModalOpen(false);
  };

  const handleAddAthlete = () => {
    // TODO: Implement add athlete functionality
    console.log('Add athlete clicked');
  };

  // Achievement management functions
  const handleAddAchievement = () => {
    setEditingAchievement(null);
    setIsAchievementModalOpen(true);
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setIsAchievementModalOpen(true);
  };

  const handleDeleteAchievement = (achievementId: string) => {
    setDeletingAchievementId(achievementId);
    setDeleteType('achievement');
    setIsDeleteModalOpen(true);
  };

  const handleSaveAchievement = (achievementData: Omit<Achievement, 'id'>) => {
    if (editingAchievement) {
      // Update existing achievement
      const updatedAchievement: Achievement = {
        ...achievementData,
        id: editingAchievement.id
      };
      
      setProfileState(prev => ({
        ...prev,
        achievements: prev.achievements.map(achievement =>
          achievement.id === editingAchievement.id ? updatedAchievement : achievement
        )
      }));
    } else {
      // Add new achievement
      const newAchievement: Achievement = {
        ...achievementData,
        id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      setProfileState(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement]
      }));
    }
    
    setIsAchievementModalOpen(false);
    setEditingAchievement(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAchievementId && !deletingCertificateId) return;
    
    setIsDeleting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (deleteType === 'achievement' && deletingAchievementId) {
        setProfileState(prev => ({
          ...prev,
          achievements: prev.achievements.filter(achievement => achievement.id !== deletingAchievementId)
        }));
        setDeletingAchievementId(null);
      } else if (deleteType === 'certificate' && deletingCertificateId) {
        setProfileState(prev => ({
          ...prev,
          certificates: prev.certificates.filter(certificate => certificate.id !== deletingCertificateId)
        }));
        setDeletingCertificateId(null);
      }
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      // In a real app, you'd show an error message to the user
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setDeletingAchievementId(null);
      setDeletingCertificateId(null);
    }
  };

  const handleCloseAchievementModal = () => {
    setIsAchievementModalOpen(false);
    setEditingAchievement(null);
  };

  // Certificate management functions
  const handleAddCertificate = () => {
    setEditingCertificate(null);
    setIsCertificateModalOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setIsCertificateModalOpen(true);
  };

  const handleDeleteCertificate = (certificateId: string) => {
    setDeletingCertificateId(certificateId);
    setDeleteType('certificate');
    setIsDeleteModalOpen(true);
  };

  const handleSaveCertificate = (certificateData: Omit<Certificate, 'id'>) => {
    if (editingCertificate) {
      // Update existing certificate
      const updatedCertificate: Certificate = {
        ...certificateData,
        id: editingCertificate.id
      };
      
      setProfileState(prev => ({
        ...prev,
        certificates: prev.certificates.map(certificate =>
          certificate.id === editingCertificate.id ? updatedCertificate : certificate
        )
      }));
    } else {
      // Add new certificate
      const newCertificate: Certificate = {
        ...certificateData,
        id: `certificate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      };
      
      setProfileState(prev => ({
        ...prev,
        certificates: [...prev.certificates, newCertificate]
      }));
    }
    
    setIsCertificateModalOpen(false);
    setEditingCertificate(null);
  };

  const handleCloseCertificateModal = () => {
    setIsCertificateModalOpen(false);
    setEditingCertificate(null);
  };

  // Get item name for delete confirmation
  const getDeletingItemName = (): string => {
    if (deleteType === 'achievement' && deletingAchievementId) {
      const achievement = profileState.achievements.find(a => a.id === deletingAchievementId);
      return achievement?.title || '';
    } else if (deleteType === 'certificate' && deletingCertificateId) {
      const certificate = profileState.certificates.find(c => c.id === deletingCertificateId);
      return certificate?.name || '';
    }
    return '';
  };

  const currentRoleConfig = roleConfigurations[profileState.currentRole];

  // Get role-specific field value
  const getFieldValue = (field: string): string => {
    const value = profileState.personalDetails[field as keyof PersonalDetails];
    if (value === undefined || value === null || value === '') {
      return 'Not specified';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Not specified';
    }
    return String(value);
  };

  // Render role-specific fields
  const renderPersonalDetailsFields = () => {
    const { editableFields } = currentRoleConfig;
    
    return editableFields.map((field) => {
      let label = field.toUpperCase();
      let fieldId = `${field}-label`;
      
      // Custom labels for better UX
      switch (field) {
        case 'organizationName':
          label = 'ORGANIZATION NAME';
          break;
        case 'organizationType':
          label = 'ORGANIZATION TYPE';
          break;
        case 'contactEmail':
          label = 'CONTACT EMAIL';
          break;
        case 'yearsExperience':
          label = 'YEARS OF EXPERIENCE';
          break;
        case 'coachingLevel':
          label = 'COACHING LEVEL';
          break;
        case 'connectedAthletes':
          label = 'CONNECTED ATHLETES';
          break;
        default:
          label = field.replace(/([A-Z])/g, ' $1').toUpperCase();
      }

      return (
        <div key={field} className="field-row">
          <span className="field-label" id={fieldId}>{label}</span>
          <span className="field-value" aria-labelledby={fieldId}>
            {getFieldValue(field)}
          </span>
        </div>
      );
    });
  };

  return (
    <main className="profile-page profile-enhanced" role="main">
      {/* Top Navigation Bar */}
      <nav className="profile-nav" role="navigation" aria-label="Profile navigation">
        <div className="profile-nav-content">
          <button
            className="back-button"
            onClick={handleGoBack}
            aria-label="Go back to previous page"
            type="button"
          >
            <ArrowLeft size={24} aria-hidden="true" />
            <span className="back-text">Back</span>
          </button>
          
          <h1 className="profile-nav-title">Profile</h1>
          
          <button
            className="edit-profile-nav-button"
            onClick={() => handleEditProfile('personal')}
            aria-label="Edit profile"
            type="button"
          >
            <Edit3 size={20} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <header className="profile-header" role="banner">
        <div className="profile-avatar">
          <div className="avatar-placeholder" role="img" aria-label="Profile avatar placeholder">
            <span className="avatar-icon" aria-hidden="true">👤</span>
          </div>
        </div>
        
        <div className="profile-info">
          <h1 className="profile-username">{profileState.personalDetails.name}</h1>
          
          {/* Role Selector */}
          <RoleSelector
            currentRole={profileState.currentRole}
            onRoleChange={handleRoleChange}
            className="profile-role-selector"
          />
          
          <div className="profile-stats" role="group" aria-label="Profile statistics">
            <div className="stat-item">
              <span className="stat-number" aria-label="4 posts">4</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" aria-label="1 follower">1</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" aria-label="0 following">0</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
          
          <button 
            className="follow-button"
            type="button"
            aria-label="Follow this user"
          >
            Not Following
          </button>
        </div>
      </header>

      <section className="personal-details" aria-labelledby="personal-details-heading">
        <div className="section-header">
          <h2 id="personal-details-heading" className="section-title">
            Personal Details ({currentRoleConfig.displayName})
          </h2>
          <button
            className="section-edit-button"
            onClick={() => handleEditProfile('personal')}
            aria-label="Edit personal details"
            type="button"
          >
            <Edit3 size={16} aria-hidden="true" />
            <span>Edit</span>
          </button>
        </div>
        
        <div className="details-card" role="group" aria-labelledby="personal-details-heading">
          {renderPersonalDetailsFields()}
          
          {/* Always show current role */}
          <div className="field-row">
            <span className="field-label" id="current-role-label">CURRENT ROLE</span>
            <span className="field-value" aria-labelledby="current-role-label">
              {currentRoleConfig.displayName}
            </span>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      {currentRoleConfig.sections.includes('achievements') && (
        <AchievementsSection
          achievements={profileState.achievements}
          isOwner={true} // TODO: Determine ownership based on current user vs profile user
          onAddAchievement={handleAddAchievement}
          onEditAchievement={handleEditAchievement}
          onDeleteAchievement={handleDeleteAchievement}
          onEditSection={() => handleEditProfile('achievements')}
        />
      )}

      {/* Certificates Section */}
      {currentRoleConfig.sections.includes('certificates') && (
        <CertificatesSection
          certificates={profileState.certificates}
          isOwner={true} // TODO: Determine ownership based on current user vs profile user
          onAddCertificate={handleAddCertificate}
          onEditCertificate={handleEditCertificate}
          onDeleteCertificate={handleDeleteCertificate}
          onEditSection={() => handleEditProfile('certificates')}
        />
      )}

      {/* Role-specific sections */}
      <RoleSpecificSections
        currentRole={profileState.currentRole}
        personalDetails={profileState.personalDetails}
        isOwner={true} // TODO: Determine ownership based on current user vs profile user
        onEditProfile={handleEditProfile}
        onAddAthlete={handleAddAthlete}
      />

      {currentRoleConfig.sections.includes('talentVideos') && (
        <section className="profile-section talent-videos-section" aria-labelledby="talent-videos-heading">
          <div className="section-header">
            <h2 id="talent-videos-heading" className="section-title">Talent Videos</h2>
          </div>
          <div className="section-placeholder">
            <p>Talent Videos section will be implemented in task 4</p>
          </div>
        </section>
      )}

      {currentRoleConfig.sections.includes('posts') && (
        <section className="profile-section posts-section" aria-labelledby="posts-heading">
          <div className="section-header">
            <h2 id="posts-heading" className="section-title">Posts</h2>
          </div>
          <div className="section-placeholder">
            <p>Posts section will be implemented in task 5</p>
          </div>
        </section>
      )}

      {/* Footer Navigation */}
      <FooterNav />

      {/* Achievement Modal */}
      <AchievementModal
        isOpen={isAchievementModalOpen}
        achievement={editingAchievement}
        onClose={handleCloseAchievementModal}
        onSave={handleSaveAchievement}
      />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        certificate={editingCertificate}
        onClose={handleCloseCertificateModal}
        onSave={handleSaveCertificate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${deleteType === 'achievement' ? 'Achievement' : 'Certificate'}`}
        message={`Are you sure you want to delete this ${deleteType}?`}
        itemName={getDeletingItemName()}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={handleCloseEditProfile}
        onSave={handleSaveProfile}
        currentRole={profileState.currentRole}
        personalDetails={profileState.personalDetails}
        physicalAttributes={profileState.physicalAttributes}
        achievements={profileState.achievements}
        certificates={profileState.certificates}
        talentVideos={profileState.talentVideos}
        posts={profileState.posts}
        initialTab={editModalInitialTab}
      />
    </main>
  );
};

export default ProfileEnhanced;