import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit3 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage, useTheme } from '../../../contexts/UnifiedPreferencesContext';
import NavigationBar from '../../../components/layout/NavigationBar';
import FooterNav from '../../../components/layout/FooterNav';
import RoleSelector from '../components/RoleSelector';
import RoleSpecificSections from '../components/RoleSpecificSections';
import ProfilePictureManager from '../components/ProfilePictureManager';
import CoverPhotoManager from '../components/CoverPhotoManager';
import SportBanner from '../components/SportBanner';
import { usePerformanceMonitoring, useMemoryMonitoring } from '../hooks/usePerformanceMonitoring';
import {
  UserRole,
  PersonalDetails,
  Achievement,
  Certificate,
  Post,
  roleConfigurations
} from '../types/ProfileTypes';
import { TalentVideo } from '../types/TalentVideoTypes';
import PhysicalAttributesSection from '../components/PhysicalAttributesSection';
import AchievementsCertificatesSection from '../components/AchievementsCertificatesSection';
import '../styles/Profile.css';

// Lazy load heavy components for better performance
const TalentVideosSection = lazy(() => import('../components/TalentVideosSection'));
const PostsSection = lazy(() => import('../components/PostsSection'));
const EditProfileModal = lazy(() => import('../components/EditProfileModal'));

const Profile: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { currentUser: firebaseUser, isGuest } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [currentRole, setCurrentRole] = useState<UserRole>('athlete');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Performance monitoring
  const { measureRender, logRenderTime } = usePerformanceMonitoring('Profile');
  useMemoryMonitoring();

  // Measure render performance
  measureRender();

  // Determine if this is the current user's profile or another user's profile
  const isOwner = !userId || userId === firebaseUser?.uid;


  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    name: 'Loading...'
  });

  const [physicalAttributes, setPhysicalAttributes] = useState({
    height: undefined,
    weight: undefined,
    dominantSide: undefined,
    personalBest: undefined,
    seasonBest: undefined,
    coachName: undefined,
    coachContact: undefined,
    trainingAcademy: undefined,
    schoolName: undefined,
    clubName: undefined
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [talentVideos, setTalentVideos] = useState<TalentVideo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false);



  // Function to load user posts from posts collection
  const loadUserPosts = async (targetUserId: string) => {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      // Query posts collection for posts by this user
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', targetUserId),
        orderBy('timestamp', 'desc')
      );

      const postsSnapshot = await getDocs(postsQuery);
      const userPosts: Post[] = [];

      postsSnapshot.forEach((doc) => {
        const postData = doc.data();

        // Build mediaUrls array from the different media fields
        const mediaUrls: string[] = [];
        if (postData.imageUrl) mediaUrls.push(postData.imageUrl);
        if (postData.videoUrl) mediaUrls.push(postData.videoUrl);
        if (postData.mediaUrl) mediaUrls.push(postData.mediaUrl);

        // Determine post type based on media
        let postType: 'photo' | 'video' | 'text' | 'mixed' = 'text';
        if (postData.mediaType === 'image' || postData.imageUrl) {
          postType = 'photo';
        } else if (postData.mediaType === 'video' || postData.videoUrl) {
          postType = 'video';
        } else if (mediaUrls.length > 1) {
          postType = 'mixed';
        }

        userPosts.push({
          id: doc.id,
          type: postType,
          title: postData.title || '',
          content: postData.caption || postData.content || '',
          mediaUrls: mediaUrls,
          thumbnailUrl: postData.thumbnailUrl || postData.imageUrl || null,
          createdDate: postData.timestamp?.toDate() || postData.createdAt?.toDate() || new Date(),
          likes: Array.isArray(postData.likes) ? postData.likes.length : (postData.likes || 0),
          comments: Array.isArray(postData.comments) ? postData.comments.length : (postData.comments || 0),
          isPublic: postData.isPublic !== undefined ? postData.isPublic : true
        });
      });

      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
      // Fallback to empty array if posts collection doesn't exist or has issues
      setPosts([]);


    }
  };

  useEffect(() => {
    // Load profile data based on whether it's current user or another user
    const loadProfileData = async () => {
      try {
        setIsLoading(true);

        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');

        const targetUserId = userId || firebaseUser?.uid;

        if (!targetUserId) {
          setError('No user ID available');
          setIsLoading(false);
          return;
        }

        try {
          // Always fetch from Firestore to get the latest data
          const userDoc = await getDoc(doc(db, 'users', targetUserId));

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Set personal details from Firestore data
            setPersonalDetails({
              name: userData.displayName || userData.name || firebaseUser?.displayName || 'User',
              dateOfBirth: userData.dateOfBirth,
              gender: userData.gender,
              mobile: userData.mobile,
              email: userData.email,
              city: userData.city,
              district: userData.district,
              state: userData.state,
              playerType: userData.playerType,
              sport: userData.sport,
              position: userData.position,
              // Organization fields
              organizationName: userData.organizationName,
              organizationType: userData.organizationType,
              location: userData.location,
              contactEmail: userData.contactEmail,
              website: userData.website,
              // Parent fields
              relationship: userData.relationship,
              connectedAthletes: userData.connectedAthletes || [],
              // Coach fields
              specializations: userData.specializations || [],
              yearsExperience: userData.yearsExperience,
              coachingLevel: userData.coachingLevel
            });

            // Set physical attributes
            setPhysicalAttributes({
              height: userData.height,
              weight: userData.weight,
              dominantSide: userData.dominantSide,
              personalBest: userData.personalBest,
              seasonBest: userData.seasonBest,
              coachName: userData.coachName,
              coachContact: userData.coachContact,
              trainingAcademy: userData.trainingAcademy,
              schoolName: userData.schoolName,
              clubName: userData.clubName
            });

            // Load other profile data
            setAchievements(userData.achievements || []);
            setCertificates(userData.certificates || []);
            setTalentVideos(userData.talentVideos || []);
            setProfilePicture(userData.profilePicture || userData.photoURL || null);
            setCoverPhoto(userData.coverPhoto || null);

            // Load saved role from Firestore if it exists (for profile owner only)
            if (isOwner && userData.role) {
              setCurrentRole(userData.role as UserRole);
            }

            // Load posts from separate posts collection
            await loadUserPosts(targetUserId);

          } else if (isOwner) {
            // If it's the current user but no document exists, create a basic profile
            const defaultProfile = {
              name: firebaseUser?.displayName || 'User'
            };
            setPersonalDetails(defaultProfile);

            // Create the user document in Firestore
            const { setDoc } = await import('firebase/firestore');
            
            // Filter out undefined values to prevent Firestore errors
            const cleanProfileData = Object.fromEntries(
              Object.entries(defaultProfile).filter(([_, value]) => value !== undefined)
            );
            
            const userDocData = {
              displayName: firebaseUser?.displayName || 'User',
              email: firebaseUser?.email,
              photoURL: firebaseUser?.photoURL,
              createdAt: new Date(),
              ...cleanProfileData
            };
            
            // Remove any remaining undefined values
            const cleanUserDocData = Object.fromEntries(
              Object.entries(userDocData).filter(([_, value]) => value !== undefined)
            );
            
            console.log('Creating user document with data:', cleanUserDocData);
            await setDoc(doc(db, 'users', targetUserId), cleanUserDocData);

            // Load posts for the new user (will be empty initially)
            await loadUserPosts(targetUserId);
          } else {
            setError('User not found');
            setIsLoading(false);
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching user profile:', fetchError);
          setError('Failed to load user profile');
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error in loadProfileData:', err);
        setError('Failed to load profile data');
        setIsLoading(false);
      }
    };

    if (firebaseUser || userId) {
      loadProfileData();
    }
  }, [userId, isOwner, firebaseUser]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleTitleClick = () => {
    navigate('/home');
  };

  const [editModalInitialTab, setEditModalInitialTab] = useState<string>('personal');

  const handleEditProfile = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleEditProfileWithTab = useCallback((initialTab: string) => {
    setEditModalInitialTab(initialTab);
    setIsEditModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((initialTab: string) => {
    setEditModalInitialTab(initialTab);
    setIsEditModalOpen(true);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isEditModalOpen) {
      setIsEditModalOpen(false);
    }
  }, [isEditModalOpen]);

  // Announce content changes to screen readers
  const announceToScreenReader = useCallback((message: string) => {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, []);

  // Handle role change with Firestore persistence
  const handleRoleChange = useCallback(async (newRole: UserRole) => {
    setCurrentRole(newRole);

    // Persist role selection to Firestore
    if (firebaseUser?.uid) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');

        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: new Date()
        });

        // Dispatch custom event to notify other components about role change
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { role: newRole }
        }));

        console.log('Role updated to:', newRole);
        announceToScreenReader(`Role changed to ${roleConfigurations[newRole].displayName}`);
      } catch (error) {
        console.error('Error saving role:', error);
        announceToScreenReader('Failed to save role change');
      }
    }
  }, [firebaseUser, announceToScreenReader]);

  // Performance optimization: Memoize expensive computations
  const profileStats = useMemo(() => ({
    posts: posts.length,
    followers: 1, // Mock data
    following: 0  // Mock data
  }), [posts.length]);

  // Memoize expensive computations
  const currentRoleConfig = useMemo(() => roleConfigurations[currentRole], [currentRole]);
  const sections = useMemo(() => currentRoleConfig.sections, [currentRoleConfig]);

  // Memoize handlers to prevent unnecessary re-renders
  const achievementHandlers = useMemo(() => ({
    onAddAchievement: () => {
      // Handle add achievement - would open add modal
      console.log('Add achievement clicked');
      announceToScreenReader('Opening add achievement form');
    },
    onEditAchievement: (achievement: Achievement) => {
      // Handle edit achievement - would open edit modal
      console.log('Edit achievement:', achievement.id);
      announceToScreenReader(`Editing achievement: ${achievement.title}`);
    },
    onDeleteAchievement: async (id: string) => {
      try {
        const achievement = achievements.find(a => a.id === id);
        const updatedAchievements = achievements.filter(a => a.id !== id);

        // Update local state
        setAchievements(updatedAchievements);

        // Save to Firebase
        if (firebaseUser?.uid) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../../../lib/firebase');

          const userRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userRef, {
            achievements: updatedAchievements,
            updatedAt: new Date()
          });
        }

        announceToScreenReader(`Achievement ${achievement?.title || ''} deleted`);
      } catch (error) {
        console.error('Error deleting achievement:', error);
        announceToScreenReader('Failed to delete achievement');
      }
    }
  }), [announceToScreenReader, achievements, firebaseUser]);

  const certificateHandlers = useMemo(() => ({
    onAddCertificate: () => {
      // Handle add certificate - would open add modal
      console.log('Add certificate clicked');
      announceToScreenReader('Opening add certificate form');
    },
    onEditCertificate: (certificate: Certificate) => {
      // Handle edit certificate - would open edit modal
      console.log('Edit certificate:', certificate.id);
      announceToScreenReader(`Editing certificate: ${certificate.name}`);
    },
    onDeleteCertificate: async (id: string) => {
      try {
        const certificate = certificates.find(c => c.id === id);
        const updatedCertificates = certificates.filter(c => c.id !== id);

        // Update local state
        setCertificates(updatedCertificates);

        // Save to Firebase
        if (firebaseUser?.uid) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../../../lib/firebase');

          const userRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userRef, {
            certificates: updatedCertificates,
            updatedAt: new Date()
          });
        }

        announceToScreenReader(`Certificate ${certificate?.name || ''} deleted`);
      } catch (error) {
        console.error('Error deleting certificate:', error);
        announceToScreenReader('Failed to delete certificate');
      }
    }
  }), [announceToScreenReader, certificates, firebaseUser]);

  // Function to reload talent videos from Firestore
  const reloadTalentVideos = useCallback(async () => {
    try {
      if (!firebaseUser?.uid) return;

      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setTalentVideos(userData.talentVideos || []);
      }
    } catch (error) {
      console.error('Error reloading talent videos:', error);
    }
  }, [firebaseUser]);

  const videoHandlers = useMemo(() => ({
    onAddVideo: () => {
      // Handle add video - reload videos after upload
      // The TalentVideosSection handles the actual upload
      console.log('Add video clicked');
      announceToScreenReader('Opening add video form');
    },
    onEditVideo: async (video: TalentVideo) => {
      try {
        // Update local state
        const updatedVideos = talentVideos.map(v => v.id === video.id ? video : v);
        setTalentVideos(updatedVideos);

        // Save to Firebase
        if (firebaseUser?.uid) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../../../lib/firebase');

          const userRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userRef, {
            talentVideos: updatedVideos,
            updatedAt: new Date()
          });
        }

        announceToScreenReader(`Video ${video.title} updated`);
      } catch (error) {
        console.error('Error updating video:', error);
        announceToScreenReader('Failed to update video');
      }
    },
    onDeleteVideo: async (id: string) => {
      try {
        const video = talentVideos.find(v => v.id === id);
        const updatedVideos = talentVideos.filter(v => v.id !== id);

        // Update local state
        setTalentVideos(updatedVideos);

        // Save to Firebase
        if (firebaseUser?.uid) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../../../lib/firebase');

          const userRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userRef, {
            talentVideos: updatedVideos,
            updatedAt: new Date()
          });

          // Also try to delete video and thumbnail from storage
          try {
            const { ref, deleteObject } = await import('firebase/storage');
            const { storage } = await import('../../../lib/firebase');

            // Extract filename from video URL
            if (video?.videoUrl) {
              const videoPath = new URL(video.videoUrl).pathname;
              const videoFileName = videoPath.split('/').pop();
              if (videoFileName) {
                const videoRef = ref(storage, `talent-videos/${firebaseUser.uid}/${decodeURIComponent(videoFileName)}`);
                await deleteObject(videoRef).catch(() => {});
              }
            }

            // Delete thumbnail
            if (video?.thumbnailUrl) {
              const thumbnailPath = new URL(video.thumbnailUrl).pathname;
              const thumbnailFileName = thumbnailPath.split('/').pop();
              if (thumbnailFileName) {
                const thumbnailRef = ref(storage, `thumbnails/${firebaseUser.uid}/${decodeURIComponent(thumbnailFileName)}`);
                await deleteObject(thumbnailRef).catch(() => {});
              }
            }
          } catch (storageError) {
            console.warn('Error deleting video files from storage:', storageError);
          }
        }

        announceToScreenReader(`Video ${video?.title || ''} deleted`);
      } catch (error) {
        console.error('Error deleting video:', error);
        announceToScreenReader('Failed to delete video');
      }
    },
    onVideoClick: (video: TalentVideo) => {
      // Handle video click - would open video player modal
      console.log('Video clicked:', video.id);
      announceToScreenReader(`Playing video: ${video.title}`);
    }
  }), [announceToScreenReader, talentVideos, firebaseUser]);

  // Auto-play video from share link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video');

    if (videoId && talentVideos.length > 0 && !isLoading) {
      // Find the video with matching ID
      const video = talentVideos.find(v => v.id === videoId);

      if (video) {
        // Scroll to talent videos section and open video player
        setTimeout(() => {
          const videoSection = document.getElementById('talent-videos-section');
          if (videoSection) {
            videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          // Trigger video click to open player
          videoHandlers.onVideoClick(video);
        }, 500); // Small delay to ensure page is fully rendered
      }
    }
  }, [talentVideos, isLoading, videoHandlers]);

  const postHandlers = useMemo(() => ({
    onPostClick: (post: Post) => {
      // Handle post click - would navigate to post detail
      console.log('Post clicked:', post.id);
      announceToScreenReader(`Opening post: ${post.title || 'Untitled post'}`);
    },
    onAddPost: async (postData: Omit<Post, 'id' | 'createdDate' | 'likes' | 'comments'>) => {
      try {
        if (!firebaseUser?.uid) {
          throw new Error('User not authenticated');
        }

        // Create new post document in posts collection
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');

        // Match the data structure used by AddPost component
        const newPostData = {
          caption: postData.content || '',
          mediaType: postData.type || 'text',
          mediaUrl: postData.mediaUrls?.[0] || null,
          imageUrl: postData.type === 'photo' ? postData.mediaUrls?.[0] : null,
          videoUrl: postData.type === 'video' ? postData.mediaUrls?.[0] : null,
          userId: firebaseUser.uid,
          userDisplayName: personalDetails.name,
          timestamp: serverTimestamp(),
          likes: [],
          comments: [],
          isPublic: postData.isPublic !== undefined ? postData.isPublic : true
        };

        const docRef = await addDoc(collection(db, 'posts'), newPostData);

        // Create the post object for local state
        const newPost: Post = {
          ...postData,
          id: docRef.id,
          createdDate: new Date(),
          likes: 0,
          comments: 0,
          type: postData.type || 'text',
          mediaUrls: postData.mediaUrls || [],
          isPublic: postData.isPublic !== undefined ? postData.isPublic : true
        };

        // Update local state
        setPosts([newPost, ...posts]);

        announceToScreenReader('New post added successfully');
      } catch (error) {
        console.error('Error adding post:', error);
        announceToScreenReader('Failed to add post');
      }
    },
    onEditPost: async (id: string, postData: Omit<Post, 'id' | 'createdDate' | 'likes' | 'comments'>) => {
      try {
        if (!firebaseUser?.uid) {
          throw new Error('User not authenticated');
        }

        // Update post document in posts collection
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');

        const postRef = doc(db, 'posts', id);
        await updateDoc(postRef, {
          ...postData,
          updatedAt: serverTimestamp()
        });

        // Update local state
        const updatedPosts = posts.map(p => p.id === id ? { ...p, ...postData } : p);
        setPosts(updatedPosts);

        announceToScreenReader('Post updated successfully');
      } catch (error) {
        console.error('Error updating post:', error);
        announceToScreenReader('Failed to update post');
      }
    },
    onDeletePost: async (id: string) => {
      try {
        if (!firebaseUser?.uid) {
          throw new Error('User not authenticated');
        }

        const post = posts.find(p => p.id === id);

        // Delete post document from posts collection
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');

        const postRef = doc(db, 'posts', id);
        await deleteDoc(postRef);

        // Update local state
        const updatedPosts = posts.filter(p => p.id !== id);
        setPosts(updatedPosts);

        announceToScreenReader(`Post ${post?.title || ''} deleted`);
      } catch (error) {
        console.error('Error deleting post:', error);
        announceToScreenReader('Failed to delete post');
      }
    }
  }), [announceToScreenReader, posts, firebaseUser]);

  const editModalHandler = useCallback(async (data: any) => {
    try {
      // Update local state immediately for better UX
      setPersonalDetails(data.personalDetails);
      setPhysicalAttributes(data.physicalAttributes);
      setAchievements(data.achievements);
      setCertificates(data.certificates);
      setTalentVideos(data.talentVideos);
      setPosts(data.posts);

      // Save to Firebase
      if (firebaseUser?.uid) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');

        // Prepare update data, filtering out undefined values to prevent Firebase errors
        const updateData = {
          // Personal details
          displayName: data.personalDetails.name,
          name: data.personalDetails.name,
          dateOfBirth: data.personalDetails.dateOfBirth,
          gender: data.personalDetails.gender,
          mobile: data.personalDetails.mobile,
          email: data.personalDetails.email,
          city: data.personalDetails.city,
          district: data.personalDetails.district,
          state: data.personalDetails.state,
          playerType: data.personalDetails.playerType,
          sport: data.personalDetails.sport,
          position: data.personalDetails.position,
          // Physical attributes
          height: data.physicalAttributes.height,
          weight: data.physicalAttributes.weight,
          dominantSide: data.physicalAttributes.dominantSide,
          personalBest: data.physicalAttributes.personalBest,
          seasonBest: data.physicalAttributes.seasonBest,
          coachName: data.physicalAttributes.coachName,
          coachContact: data.physicalAttributes.coachContact,
          trainingAcademy: data.physicalAttributes.trainingAcademy,
          schoolName: data.physicalAttributes.schoolName,
          clubName: data.physicalAttributes.clubName,
          // Organization fields
          organizationName: data.personalDetails.organizationName,
          organizationType: data.personalDetails.organizationType,
          location: data.personalDetails.location,
          contactEmail: data.personalDetails.contactEmail,
          website: data.personalDetails.website,
          // Parent fields
          relationship: data.personalDetails.relationship,
          connectedAthletes: data.personalDetails.connectedAthletes,
          // Coach fields
          specializations: data.personalDetails.specializations,
          yearsExperience: data.personalDetails.yearsExperience,
          coachingLevel: data.personalDetails.coachingLevel,
          // Other profile data
          achievements: data.achievements,
          certificates: data.certificates,
          talentVideos: data.talentVideos,
          // Note: posts are now stored in separate posts collection, not in user document
          updatedAt: new Date()
        };

        // Filter out undefined values to prevent Firestore errors
        const cleanedUpdateData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, cleanedUpdateData);

        console.log('Profile updated successfully in Firebase');
      }

      setIsEditModalOpen(false);

      // Announce successful save to screen readers
      announceToScreenReader('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      announceToScreenReader('Failed to save profile changes');
      alert('Failed to save profile changes. Please try again.');
    }
  }, [announceToScreenReader, firebaseUser]);

  // Profile picture upload handler
  const handleProfilePictureUpload = useCallback(async (file: Blob) => {
    setUploadingProfilePicture(true);
    try {
      if (!firebaseUser?.uid) {
        throw new Error('User not authenticated');
      }

      // Upload to Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../../../lib/firebase');

      const storageRef = ref(storage, `users/${firebaseUser.uid}/profile-picture.jpg`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Update profile picture in local state
      setProfilePicture(downloadURL);

      // Update Firestore with the new URL
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        profilePicture: downloadURL,
        photoURL: downloadURL,
        updatedAt: new Date()
      });

      announceToScreenReader('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
      // Revert to previous state on error
      if (firebaseUser?.uid) {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfilePicture(userDoc.data().profilePicture || null);
        }
      }
    } finally {
      setUploadingProfilePicture(false);
    }
  }, [announceToScreenReader, firebaseUser]);

  // Profile picture delete handler
  const handleProfilePictureDelete = useCallback(async () => {
    try {
      if (!firebaseUser?.uid) {
        throw new Error('User not authenticated');
      }

      // Delete from Firebase Storage
      try {
        const { ref, deleteObject } = await import('firebase/storage');
        const { storage } = await import('../../../lib/firebase');
        const storageRef = ref(storage, `users/${firebaseUser.uid}/profile-picture.jpg`);
        await deleteObject(storageRef);
      } catch (storageError: any) {
        // Ignore if file doesn't exist
        if (storageError?.code !== 'storage/object-not-found') {
          throw storageError;
        }
      }

      // Update local state
      setProfilePicture(null);

      // Update Firestore
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        profilePicture: null,
        photoURL: null,
        updatedAt: new Date()
      });

      announceToScreenReader('Profile picture removed');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      announceToScreenReader('Failed to remove profile picture');
      alert('Failed to remove profile picture. Please try again.');
    }
  }, [announceToScreenReader, firebaseUser]);

  // Cover photo upload handler
  const handleCoverPhotoUpload = useCallback(async (file: Blob) => {
    setUploadingCoverPhoto(true);
    try {
      if (!firebaseUser?.uid) {
        throw new Error('User not authenticated');
      }

      // Upload to Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../../../lib/firebase');

      const storageRef = ref(storage, `users/${firebaseUser.uid}/cover-photo.jpg`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Update cover photo in local state
      setCoverPhoto(downloadURL);

      // Update Firestore with the new URL
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        coverPhoto: downloadURL,
        updatedAt: new Date()
      });

      announceToScreenReader('Cover photo updated successfully');
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      alert('Failed to upload cover photo. Please try again.');
      // Revert to previous state on error
      if (firebaseUser?.uid) {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCoverPhoto(userDoc.data().coverPhoto || null);
        }
      }
    } finally {
      setUploadingCoverPhoto(false);
    }
  }, [announceToScreenReader, firebaseUser]);

  // Cover photo delete handler
  const handleCoverPhotoDelete = useCallback(async () => {
    try {
      if (!firebaseUser?.uid) {
        throw new Error('User not authenticated');
      }

      // Delete from Firebase Storage
      try {
        const { ref, deleteObject } = await import('firebase/storage');
        const { storage } = await import('../../../lib/firebase');
        const storageRef = ref(storage, `users/${firebaseUser.uid}/cover-photo.jpg`);
        await deleteObject(storageRef);
      } catch (storageError: any) {
        // Ignore if file doesn't exist
        if (storageError?.code !== 'storage/object-not-found') {
          throw storageError;
        }
      }

      // Update local state
      setCoverPhoto(null);

      // Update Firestore
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        coverPhoto: null,
        updatedAt: new Date()
      });

      announceToScreenReader('Cover photo removed');
    } catch (error) {
      console.error('Error removing cover photo:', error);
      announceToScreenReader('Failed to remove cover photo');
      alert('Failed to remove cover photo. Please try again.');
    }
  }, [announceToScreenReader, firebaseUser]);

  // Follow/Unfollow handler for other users' profiles
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = useCallback(async () => {
    if (!userId || isOwner || isGuest() || !firebaseUser) return;

    setFollowLoading(true);
    try {
      // In a real app, this would send a friend request or follow the user
      // For now, we'll just toggle the state
      setIsFollowing(!isFollowing);
      announceToScreenReader(isFollowing ? 'Unfollowed user' : 'Following user');

      // TODO: Implement actual friend request/follow logic with Firebase
      console.log(isFollowing ? 'Unfollowing user:' : 'Following user:', userId);
    } catch (error) {
      console.error('Error toggling follow status:', error);
      announceToScreenReader('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  }, [userId, isOwner, isGuest, firebaseUser, isFollowing, announceToScreenReader]);

  // Log render performance after component updates
  useEffect(() => {
    logRenderTime();
  });

  if (isLoading) {
    return (
      <main className="profile-page" role="main">
        <NavigationBar
          currentUser={firebaseUser}
          isGuest={isGuest()}
          onTitleClick={handleTitleClick}
          title={t('profile')}
        />
        <div className="profile-loading" role="status" aria-label={t('loadingProfile')}>
          <div className="loading-spinner"></div>
          <p>{t('loadingProfile')}</p>
        </div>
        <FooterNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page" role="main">
        <NavigationBar
          currentUser={firebaseUser}
          isGuest={isGuest()}
          onTitleClick={handleTitleClick}
          title={t('profile')}
        />
        <div className="profile-error" role="alert">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t('retry')}</button>
        </div>
        <FooterNav />
      </main>
    );
  }

  return (
    <main className="profile-page" role="main" onKeyDown={handleKeyDown}>
      {/* Skip Links for Keyboard Navigation */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <a href="#profile-sections" className="skip-link">Skip to profile sections</a>
        <a href="#footer-nav" className="skip-link">Skip to navigation</a>
      </div>

      {/* Live Region for Screen Reader Announcements */}
      <div
        className="live-region"
        aria-live="polite"
        aria-atomic="true"
        id="live-region"
      ></div>

      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="offline-indicator" role="alert">
          You're offline. Some features may not work.
        </div>
      )}

      {/* Top Navigation Bar */}
      <NavigationBar
        currentUser={firebaseUser}
        isGuest={isGuest()}
        onTitleClick={handleTitleClick}
        title={t('profile')}
        showBackButton={true}
        onBackClick={handleGoBack}
      />



      <div className="main-content profile-main-content">
        {/* Cover Photo Section */}
        <CoverPhotoManager
          coverPhoto={coverPhoto}
          onUpload={handleCoverPhotoUpload}
          onDelete={handleCoverPhotoDelete}
          uploading={uploadingCoverPhoto}
          isOwnProfile={isOwner}
          isGuest={isGuest()}
          className="profile-cover-photo"
        />

        <header className="profile-header" role="banner" id="main-content">
          <div className="profile-avatar">
            <ProfilePictureManager
              profilePicture={profilePicture}
              onUpload={handleProfilePictureUpload}
              onDelete={handleProfilePictureDelete}
              uploading={uploadingProfilePicture}
              isOwnProfile={isOwner}
              isGuest={isGuest()}
              size="large"
            />
          </div>

          <div className="profile-info">
            <div className="profile-name-section">
              <h1 className="profile-username">{personalDetails.name}</h1>
              {isOwner && (
                <button
                  className="edit-profile-button"
                  onClick={handleEditProfile}
                  aria-label={t('editProfile')}
                  type="button"
                >
                  <Edit3 size={18} aria-hidden="true" />
                  <span className="edit-text">{t('edit')}</span>
                </button>
              )}
            </div>

            {/* Sport Banner - Shows sport/position info below name */}
            <SportBanner
              sport={personalDetails.sport}
              position={personalDetails.position}
              playerType={personalDetails.playerType}
              role={currentRole}
              organizationType={personalDetails.organizationType}
              specializations={personalDetails.specializations}
            />

            {/* Role Selector - only show for profile owner */}
            {isOwner && (
              <RoleSelector
                currentRole={currentRole}
                onRoleChange={handleRoleChange}
                className="profile-role-selector"
              />
            )}

            <div className="profile-stats" role="group" aria-label={t('profile')}>
              <div className="stat-item">
                <span className="stat-number" aria-label={`${profileStats.posts} ${t('posts')}`}>{profileStats.posts}</span>
                <span className="stat-label">{t('posts')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number" aria-label={`${profileStats.followers} ${t('followers')}`}>{profileStats.followers}</span>
                <span className="stat-label">{t('followers')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number" aria-label={`${profileStats.following} ${t('following')}`}>{profileStats.following}</span>
                <span className="stat-label">{t('following')}</span>
              </div>
            </div>

            {!isOwner && (
              <button
                className={`follow-button ${isFollowing ? 'following' : 'not-following'}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
                type="button"
                aria-label={isFollowing ? t('following') : t('follow')}
              >
                {followLoading ? t('loading') : (isFollowing ? t('following') : t('follow'))}
              </button>
            )}
          </div>
        </header>

        {/* Personal Details Section */}
        <section className="personal-details" aria-labelledby="personal-details-heading">
          <div className="section-header">
            <h2 id="personal-details-heading" className="section-title">{t('personalDetails')}</h2>
            {isOwner && (
              <button
                className="section-edit-button"
                onClick={handleEditProfile}
                aria-label={t('editProfile')}
                type="button"
              >
                <Edit3 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="details-card" role="group" aria-labelledby="personal-details-heading">
            <div className="field-row">
              <span className="field-label" id="name-label">{t('name').toUpperCase()}</span>
              <span className="field-value" aria-labelledby="name-label">{personalDetails.name}</span>
            </div>
            {currentRoleConfig.editableFields.includes('dateOfBirth') && (
              <div className="field-row">
                <span className="field-label" id="dob-label">{t('dateOfBirth').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="dob-label">{personalDetails.dateOfBirth || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('gender') && (
              <div className="field-row">
                <span className="field-label" id="gender-label">{t('gender').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="gender-label">{personalDetails.gender || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('mobile') && (
              <div className="field-row">
                <span className="field-label" id="mobile-label">{t('mobile').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="mobile-label">{personalDetails.mobile || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('email') && (
              <div className="field-row">
                <span className="field-label" id="email-label">{t('email').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="email-label">{personalDetails.email || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('city') && (
              <div className="field-row">
                <span className="field-label" id="city-label">{t('city').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="city-label">{personalDetails.city || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('playerType') && (
              <div className="field-row">
                <span className="field-label" id="player-type-label">{t('playerType').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="player-type-label">{personalDetails.playerType || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('sport') && (
              <div className="field-row">
                <span className="field-label" id="sport-label">{t('sport').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="sport-label">{personalDetails.sport || t('notSpecified')}</span>
              </div>
            )}
            {currentRoleConfig.editableFields.includes('position') && (
              <div className="field-row">
                <span className="field-label" id="position-label">{t('position').toUpperCase()}</span>
                <span className="field-value" aria-labelledby="position-label">{personalDetails.position || t('notSpecified')}</span>
              </div>
            )}
            <div className="field-row">
              <span className="field-label" id="role-label">{t('role').toUpperCase()}</span>
              <span className="field-value" aria-labelledby="role-label">{currentRoleConfig.displayName}</span>
            </div>
          </div>
        </section>

        {/* Physical Attributes Section - Athletes only */}
        {sections.includes('physicalAttributes') && (
          <PhysicalAttributesSection
            physicalAttributes={physicalAttributes}
            isOwner={isOwner}
            onEditSection={() => handleEditProfileWithTab('physicalAttributes')}
          />
        )}

        {/* Profile Sections Container */}
        <div id="profile-sections" role="region" aria-label="Profile sections">
          {/* Role-specific sections */}
          <RoleSpecificSections
            currentRole={currentRole}
            personalDetails={personalDetails}
            isOwner={isOwner}
            onEditProfile={handleEditProfile}
          />
        </div>

        {/* Achievements & Certificates Section - Combined */}
        {(sections.includes('achievements') || sections.includes('certificates')) && (
          <AchievementsCertificatesSection
            achievements={achievements}
            certificates={certificates}
            isOwner={isOwner}
            {...achievementHandlers}
            {...certificateHandlers}
            onEditSection={() => handleEditProfileWithTab('achievements')}
            onOpenEditModal={handleOpenEditModal}
          />
        )}

        {/* Talent Videos Section - Athletes only */}
        {sections.includes('talentVideos') && (
          <section
            aria-labelledby="talent-videos-heading"
            role="region"
            tabIndex={-1}
            id="talent-videos-section"
          >
            <Suspense fallback={
              <div className="section-loading" role="status" aria-label="Loading talent videos">
                <div className="section-loading-spinner" aria-hidden="true"></div>
                <p>Loading videos...</p>
                <div className="sr-only">Please wait while talent videos are loading</div>
              </div>
            }>
              <TalentVideosSection
                videos={talentVideos}
                isOwner={isOwner}
                {...videoHandlers}
                onOpenEditModal={handleOpenEditModal}
              />
            </Suspense>
          </section>
        )}

        {/* Posts Section */}
        {sections.includes('posts') && (
          <section
            aria-labelledby="posts-heading"
            role="region"
            tabIndex={-1}
            id="posts-section"
          >


            <Suspense fallback={
              <div className="section-loading" role="status" aria-label="Loading posts">
                <div className="section-loading-spinner" aria-hidden="true"></div>
                <p>Loading posts...</p>
                <div className="sr-only">Please wait while posts are loading</div>
              </div>
            }>
              <PostsSection
                posts={posts}
                isOwner={isOwner}
                {...postHandlers}
                onOpenEditModal={handleOpenEditModal}
              />
            </Suspense>
          </section>
        )}

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <Suspense fallback={
            <div className="modal-loading" role="status" aria-label="Loading edit profile modal">
              <div className="loading-spinner" aria-hidden="true"></div>
              <p>Loading editor...</p>
            </div>
          }>
            <EditProfileModal
              isOpen={isEditModalOpen}
              personalDetails={personalDetails}
              physicalAttributes={physicalAttributes}
              currentRole={currentRole}
              achievements={achievements}
              certificates={certificates}
              talentVideos={talentVideos}
              posts={posts}
              onSave={editModalHandler}
              onClose={() => setIsEditModalOpen(false)}
              initialTab={editModalInitialTab as any}
            />
          </Suspense>
        )}

      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </main>
  );
});

Profile.displayName = 'Profile';

export default Profile;