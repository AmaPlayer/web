import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc, limit } from 'firebase/firestore';
import { Search as SearchIcon, UserPlus, Check, X, Filter, MapPin, User, Award, Target, Calendar, Settings, Bell } from 'lucide-react';
import FooterNav from '../../components/layout/FooterNav';
import SettingsMenu from '../../components/common/settings/SettingsMenu';
import NotificationDropdown from '../../components/common/notifications/NotificationDropdown';
import SafeImage from '../../components/common/SafeImage';
import './Search.css';

interface UserData {
  id: string;
  displayName?: string;
  email?: string;
  name?: string;
  bio?: string;
  photoURL?: string;
  location?: string;
  role?: string;
  skills?: string[];
  sport?: string;
  sex?: string;
  age?: number | string;
  achievements?: Array<{ title: string }>;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderPhoto: string;
  receiverName: string;
  receiverPhoto: string;
  status: string;
  timestamp: any;
}

interface Friendship {
  id: string;
  user1: string;
  user2: string;
  createdAt: any;
}

interface SearchFilters {
  location: string;
  role: string;
  skill: string;
  sport: string;
  name: string;
  achievement: string;
  sex: string;
  age: string;
  // New athlete-specific filters
  eventType: string;
  position: string;
  subcategory: string;
}

export default function Search() {
  const navigate = useNavigate();
  const { currentUser, isGuest } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    role: '',
    skill: '',
    sport: '',
    name: '',
    achievement: '',
    sex: '',
    age: '',
    eventType: '',
    position: '',
    subcategory: ''
  });
  
  // Notification and Settings state
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const fetchSentRequests = useCallback(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      setSentRequests(requests);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !isGuest()) {
      fetchSentRequests();
      const unsubscribeFriendships = fetchFriendships();
      const unsubscribeFollowedUsers = fetchFollowedUsers();
      
      // Return cleanup function
      return () => {
        if (unsubscribeFriendships) unsubscribeFriendships();
        if (unsubscribeFollowedUsers) unsubscribeFollowedUsers();
      };
    }
  }, [currentUser, isGuest, fetchSentRequests]);

  // Listen for friendship changes from other components
  useEffect(() => {
    const handleFriendshipChange = (event: Event) => {
      console.log('🔄 Search - Received friendship change event:', (event as CustomEvent).detail);
      // Force aggressive refresh of ALL friendship data
      if (currentUser && !isGuest()) {
        console.log('🔄 Search - Force refreshing all friendship data...');
        
        // Clear current state immediately
        setFriendships([]);
        setSentRequests([]);
        setFollowedUsers([]);
        
        // Refresh from database with delay
        setTimeout(() => {
          console.log('🔄 Search - Fetching fresh data from database...');
          fetchFriendships();
          fetchSentRequests();
          fetchFollowedUsers();
        }, 1000);
        
        // Also refresh search results if there are any
        if (searchResults.length > 0) {
          console.log('🔄 Search - Refreshing search results...');
          setTimeout(() => {
            handleSearch();
          }, 1500);
        }
      }
    };

    window.addEventListener('friendshipChanged', handleFriendshipChange as EventListener);
    
    return () => {
      window.removeEventListener('friendshipChanged', handleFriendshipChange as EventListener);
    };
  }, [currentUser, searchResults.length]);

  // Live search effect with debouncing
  useEffect(() => {
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Don't search if no criteria and if guest
    if (isGuest()) {
      setSearchResults([]);
      return;
    }

    // Search if there's a search term or any filter applied
    const hasSearchCriteria = searchTerm.trim().length >= 2 || 
                            Object.values(filters).some(filter => filter.trim().length > 0);

    if (!hasSearchCriteria) {
      setSearchResults([]);
      return;
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      handleSearch();
    }, 500); // 500ms delay

    setSearchDebounceTimer(timer);

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch unread notification count
  useEffect(() => {
    if (!currentUser || isGuest()) {
      setUnreadCount(0);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('receiverId', '==', currentUser.uid),
        where('read', '==', false)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size);
      }, (error) => {
        console.error('Error fetching notification count:', error);
        setUnreadCount(0);
      });

    } catch (error) {
      console.error('Error setting up notification listener:', error);
      setUnreadCount(0);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, isGuest]);

  const fetchFriendships = () => {
    if (!currentUser) return;
    
    console.log('🔍 Setting up real-time friendships listener for search');
    
    const q1 = query(
      collection(db, 'friendships'),
      where('user1', '==', currentUser.uid)
    );
    const q2 = query(
      collection(db, 'friendships'),
      where('user2', '==', currentUser.uid)
    );
    
    const updateFriendshipsList = async () => {
      try {
        const friendshipsList: Friendship[] = [];
        
        // Get friendships where current user is user1
        const snapshot1 = await getDocs(q1);
        snapshot1.forEach((doc) => {
          friendshipsList.push({ id: doc.id, ...doc.data() } as Friendship);
        });
        
        // Get friendships where current user is user2
        const snapshot2 = await getDocs(q2);
        snapshot2.forEach((doc) => {
          friendshipsList.push({ id: doc.id, ...doc.data() } as Friendship);
        });
        
        console.log('✅ Search - Updated friendships list:', friendshipsList.length);
        setFriendships(friendshipsList);
      } catch (error) {
        console.error('❌ Error fetching friendships for search:', error);
      }
    };
    
    // Set up real-time listeners
    const unsubscribe1 = onSnapshot(q1, () => {
      console.log('🔄 Friendship change detected in search (user1)');
      updateFriendshipsList();
    });
    const unsubscribe2 = onSnapshot(q2, () => {
      console.log('🔄 Friendship change detected in search (user2)');
      updateFriendshipsList();
    });
    
    // Initial load
    updateFriendshipsList();
    
    // Return cleanup function
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  };

  const fetchFollowedUsers = () => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const followed: string[] = [];
      snapshot.forEach((doc) => {
        followed.push(doc.data().followingId);
      });
      setFollowedUsers(followed);
    });

    return unsubscribe;
  };

  const handleFollow = async (userId: string, userName: string): Promise<void> => {
    if (isGuest()) {
      alert('Please sign up or log in to follow users');
      return;
    }

    if (!currentUser) return;

    setFollowingUser(userId);
    
    try {
      const isFollowing = followedUsers.includes(userId);
      
      if (isFollowing) {
        // Unfollow: remove from follows collection
        const q = query(
          collection(db, 'follows'),
          where('followerId', '==', currentUser.uid),
          where('followingId', '==', userId)
        );
        
        const snapshot = await getDocs(q);
        snapshot.forEach(async (docSnapshot) => {
          await deleteDoc(doc(db, 'follows', docSnapshot.id));
        });
        
        console.log(`✅ Unfollowed ${userName}`);
      } else {
        // Follow: add to follows collection
        await addDoc(collection(db, 'follows'), {
          followerId: currentUser.uid,
          followingId: userId,
          followerName: currentUser.displayName || 'Anonymous User',
          followingName: userName,
          timestamp: serverTimestamp()
        });
        
        console.log(`✅ Now following ${userName}`);
      }
    } catch (error: any) {
      console.error('❌ Error updating follow status:', error);
      alert('Failed to update follow status: ' + error.message);
    }
    
    setFollowingUser(null);
  };

  const handleSearch = async (): Promise<void> => {
    if (isGuest() || !currentUser) {
      return;
    }

    setLoading(true);

    try {
      let results: UserData[] = [];
      const searchTermLower = searchTerm.toLowerCase().trim();

      // Use efficient indexed queries if athlete-specific filters are applied
      const hasAthleteFilters = filters.sport || filters.eventType || filters.position || filters.subcategory;
      const isAthleteSearch = filters.role === 'athlete' || hasAthleteFilters;

      if (isAthleteSearch && hasAthleteFilters) {
        console.log('🚀 Using efficient indexed athlete search');

        // Build Firestore query with indexed fields
        const constraints: any[] = [];

        // Always filter by role if searching athletes
        constraints.push(where('role', '==', 'athlete'));

        // Add sport filter (uses array-contains index)
        if (filters.sport) {
          constraints.push(where('sports', 'array-contains', filters.sport.toLowerCase()));
        }

        // Add event type filter (uses array-contains index)
        if (filters.eventType) {
          constraints.push(where('eventTypes', 'array-contains', filters.eventType.toLowerCase()));
        }

        // Add position filter (uses equality index)
        if (filters.position) {
          constraints.push(where('position', '==', filters.position.toLowerCase()));
        }

        // Add subcategory filter (uses equality index)
        if (filters.subcategory) {
          constraints.push(where('subcategory', '==', filters.subcategory.toLowerCase()));
        }

        // Add limit
        constraints.push(limit(100));

        const q = query(collection(db, 'users'), ...constraints);
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() } as UserData;
          if (doc.id !== currentUser.uid) {
            results.push(userData);
          }
        });

        console.log(`✅ Found ${results.length} athletes using indexed query`);

        // Apply client-side filters for remaining criteria
        results = results.filter(userData => {
          let matches = true;

          // Text search
          if (searchTermLower) {
            const displayName = (userData.displayName || '').toLowerCase().trim();
            const email = (userData.email || '').toLowerCase().trim();
            const name = (userData.name || '').toLowerCase().trim();

            const textMatch = displayName.includes(searchTermLower) ||
                            email.includes(searchTermLower) ||
                            name.includes(searchTermLower);

            if (!textMatch) matches = false;
          }

          // Location
          if (matches && filters.location && userData.location) {
            if (!userData.location.toLowerCase().includes(filters.location.toLowerCase())) {
              matches = false;
            }
          }

          // Sex
          if (matches && filters.sex && userData.sex) {
            if (userData.sex !== filters.sex) {
              matches = false;
            }
          }

          // Age
          if (matches && filters.age && userData.age) {
            const userAge = parseInt(String(userData.age));
            const exactAge = parseInt(filters.age);
            if (userAge !== exactAge) {
              matches = false;
            }
          }

          return matches;
        });

      } else {
        // Fallback to full collection scan for non-athlete or simple searches
        console.log('📊 Using full collection scan (no athlete filters)');

        const allUsersSnapshot = await getDocs(collection(db, 'users'));

        allUsersSnapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() } as UserData;

          // Don't include current user in results
          if (doc.id !== currentUser.uid) {
            let matches = true;

            // Text search (if provided)
            if (searchTermLower) {
              const displayName = (userData.displayName || '').toLowerCase().trim();
              const email = (userData.email || '').toLowerCase().trim();
              const name = (userData.name || '').toLowerCase().trim();

              const textMatch = displayName.includes(searchTermLower) ||
                              email.includes(searchTermLower) ||
                              name.includes(searchTermLower);

              if (!textMatch) matches = false;
            }

            // Apply filters
            if (matches && filters.location && userData.location) {
              if (!userData.location.toLowerCase().includes(filters.location.toLowerCase())) {
                matches = false;
              }
            }

            if (matches && filters.role && userData.role) {
              if (userData.role !== filters.role) {
                matches = false;
              }
            }

            if (matches && filters.skill && userData.skills) {
              const skillMatch = userData.skills.some(skill =>
                skill.toLowerCase().includes(filters.skill.toLowerCase())
              );
              if (!skillMatch) matches = false;
            }

            if (matches && filters.sport && userData.sport) {
              if (!userData.sport.toLowerCase().includes(filters.sport.toLowerCase())) {
                matches = false;
              }
            }

            if (matches && filters.name && userData.name) {
              if (!userData.name.toLowerCase().includes(filters.name.toLowerCase())) {
                matches = false;
              }
            }

            if (matches && filters.achievement && userData.achievements) {
              const achievementMatch = userData.achievements.some(achievement =>
                achievement.title.toLowerCase().includes(filters.achievement.toLowerCase())
              );
              if (!achievementMatch) matches = false;
            }

            if (matches && filters.sex && userData.sex) {
              if (userData.sex !== filters.sex) {
                matches = false;
              }
            }

            // Age filtering
            if (matches && userData.age) {
              const userAge = parseInt(String(userData.age));

              // Exact age filter
              if (filters.age) {
                const exactAge = parseInt(filters.age);
                if (userAge !== exactAge) {
                  matches = false;
                }
              }

            } else if (filters.age) {
              // If age filters are applied but user has no age data, exclude them
              matches = false;
            }

            if (matches) {
              results.push(userData);
            }
          }
        });
      }

      setSearchResults(results);
    } catch (error: any) {
      console.error('Error searching users:', error);

      // Check for index errors
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.error('🚨 Missing Firestore index! Deploy indexes with: firebase deploy --only firestore:indexes');
        alert('Database index required. Please contact administrator or deploy indexes.');
      } else {
        alert('Error searching users: ' + error.message);
      }
    }
    setLoading(false);
  };


  const handleSendFriendRequest = async (userId: string, userName: string, userPhoto?: string): Promise<void> => {
    if (isGuest()) {
      if (window.confirm('Please sign up or log in to send friend requests.\n\nWould you like to go to the login page?')) {
        navigate('/login');
      }
      return;
    }

    if (!currentUser) return;

    try {
      const requestStatus = getRequestStatus(userId);
      
      if (requestStatus === 'pending') {
        // Cancel friend request
        const request = sentRequests.find(req => req.receiverId === userId);
        if (request) {
          await deleteDoc(doc(db, 'friendRequests', request.id));
          alert('Friend request cancelled');
        }
      } else {
        // Send friend request
        await addDoc(collection(db, 'friendRequests'), {
          senderId: currentUser.uid,
          receiverId: userId,
          senderName: currentUser.displayName || 'Anonymous User',
          senderPhoto: currentUser.photoURL || '',
          receiverName: userName,
          receiverPhoto: userPhoto || '',
          status: 'pending',
          timestamp: serverTimestamp()
        });
        
        alert('Friend request sent!');
      }
    } catch (error: any) {
      console.error('Error with friend request:', error);
      alert('Failed to update friend request');
    }
  };

  const getRequestStatus = (userId: string): string | null => {
    const request = sentRequests.find(req => req.receiverId === userId);
    if (!request) return null;
    return request.status;
  };

  const isAlreadyFriend = (userId: string): boolean => {
    return friendships.some(friendship => 
      friendship.user1 === userId || friendship.user2 === userId
    );
  };

  const handleFilterChange = (filterName: keyof SearchFilters, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = (): void => {
    setFilters({
      location: '',
      role: '',
      skill: '',
      sport: '',
      name: '',
      achievement: '',
      sex: '',
      age: '',
      eventType: '',
      position: '',
      subcategory: ''
    });
    setSearchTerm('');
    setSearchResults([]);
  };


  const hasActiveFilters = Object.values(filters).some(filter => filter.trim().length > 0) || searchTerm.trim().length > 0;

  // Notification and Settings handlers
  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
    setNotificationsOpen(false); // Close notifications if open
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleNotificationsToggle = () => {
    setNotificationsOpen(!notificationsOpen);
    setSettingsOpen(false); // Close settings if open
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
  };

  // Guest view
  if (isGuest()) {
    return (
      <div className="search">
        <nav className="nav-bar">
          <div className="nav-content">
            <h1>Search</h1>
            <div className="nav-controls">
              {/* Settings for guest */}
              <div className="settings-container">
                <button
                  ref={settingsButtonRef}
                  className="settings-btn"
                  onClick={handleSettingsToggle}
                  aria-label="Open settings menu"
                  aria-expanded={settingsOpen}
                  aria-haspopup="true"
                  title="Settings"
                  type="button"
                >
                  <Settings size={20} aria-hidden="true" />
                  <span className="sr-only">Settings</span>
                </button>
                
                <SettingsMenu
                  isOpen={settingsOpen}
                  onClose={handleSettingsClose}
                  isGuest={true}
                  triggerButtonRef={settingsButtonRef}
                  currentUser={null}
                />
              </div>
            </div>
          </div>
        </nav>

        <div className="main-content search-content">
          <div className="guest-restriction">
            <div className="guest-restriction-content">
              <SearchIcon size={48} />
              <h2>User Search</h2>
              <p>🔒 Guest accounts cannot search for users</p>
              <p>Sign up to find and connect with friends!</p>
              <button 
                className="sign-up-btn"
                onClick={() => navigate('/login')}
              >
                Sign Up / Sign In
              </button>
            </div>
          </div>
        </div>
        
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="search">
      <nav className="nav-bar">
        <div className="nav-content">
          <h1>Search</h1>
          <div className="nav-controls">
            {/* Notifications */}
            <div className="notifications-container">
              <button
                ref={notificationButtonRef}
                className="notification-btn"
                onClick={handleNotificationsToggle}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
                title="Notifications"
                type="button"
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                <span className="sr-only">
                  Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}
                </span>
              </button>

              <NotificationDropdown
                isOpen={notificationsOpen}
                onClose={handleNotificationsClose}
                triggerButtonRef={notificationButtonRef}
              />
            </div>
            
            {/* Settings */}
            <div className="settings-container">
              <button
                ref={settingsButtonRef}
                className="settings-btn"
                onClick={handleSettingsToggle}
                aria-label="Open settings menu"
                aria-expanded={settingsOpen}
                aria-haspopup="true"
                title="Settings"
                type="button"
              >
                <Settings size={20} aria-hidden="true" />
                <span className="sr-only">Settings</span>
              </button>
              
              <SettingsMenu
                isOpen={settingsOpen}
                onClose={handleSettingsClose}
                isGuest={false}
                triggerButtonRef={settingsButtonRef}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="main-content search-content">
        <div className="search-bar">
          <div className="search-input-container">
            <SearchIcon size={20} />
            <input
              type="text"
              placeholder="Search users by name, email, or display name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
            </button>
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="search-filters">
            <div className="filters-header">
              <h3><Filter size={20} />Advanced Filters</h3>
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label><MapPin size={16} />Location</label>
                <input
                  type="text"
                  placeholder="City, State, Country"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label><User size={16} />Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                  <option value="organisation">Organization</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label><Target size={16} />Skill</label>
                <input
                  type="text"
                  placeholder="e.g., Swimming, Running"
                  value={filters.skill}
                  onChange={(e) => handleFilterChange('skill', e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label><Target size={16} />Sport</label>
                <input
                  type="text"
                  placeholder="e.g., Football, Basketball"
                  value={filters.sport}
                  onChange={(e) => handleFilterChange('sport', e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label><User size={16} />Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label><Award size={16} />Achievement</label>
                <input
                  type="text"
                  placeholder="e.g., Gold Medal, Champion"
                  value={filters.achievement}
                  onChange={(e) => handleFilterChange('achievement', e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label><User size={16} />Gender</label>
                <select
                  value={filters.sex}
                  onChange={(e) => handleFilterChange('sex', e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label><Calendar size={16} />Exact Age</label>
                <input
                  type="number"
                  placeholder="e.g., 25"
                  min="13"
                  max="100"
                  value={filters.age}
                  onChange={(e) => handleFilterChange('age', e.target.value)}
                />
              </div>

              {/* New Athlete-Specific Filters */}
              <div className="filter-group">
                <label><Target size={16} />Event Type</label>
                <input
                  type="text"
                  placeholder="e.g., 5000m, marathon"
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label><Target size={16} />Position</label>
                <input
                  type="text"
                  placeholder="e.g., distance-runner, sprinter"
                  value={filters.position}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label><Target size={16} />Subcategory</label>
                <input
                  type="text"
                  placeholder="e.g., long-distance, middle-distance"
                  value={filters.subcategory}
                  onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                />
              </div>

            </div>
          </div>
        )}
        
        <div className="search-results">
          {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <div className="search-placeholder">
              <SearchIcon size={48} />
              <h3>Keep typing...</h3>
              <p>Type at least 2 characters to start searching</p>
            </div>
          )}

          {searchResults.length === 0 && searchTerm && searchTerm.trim().length >= 2 && !loading && (
            <div className="empty-state">
              <SearchIcon size={48} />
              <h3>No users found</h3>
              <p>Try searching with different keywords</p>
            </div>
          )}
          
          {searchResults.length === 0 && !searchTerm && (
            <div className="search-placeholder">
              <SearchIcon size={48} />
              <h3>Find Friends</h3>
              <p>Start typing to search for users and send friend requests</p>
            </div>
          )}
          
          {searchResults.map((user) => {
            const requestStatus = getRequestStatus(user.id);
            const isFriend = isAlreadyFriend(user.id);
            const isFollowing = followedUsers.includes(user.id);
            const isProcessing = followingUser === user.id;
            
            return (
              <div key={user.id} className="user-result">
                <div className="user-avatar" onClick={() => navigate(`/profile/${user.id}`)}>
                  <SafeImage 
                    src={user.photoURL || ''} 
                    alt={user.displayName}
                    placeholder="avatar"
                    className="user-avatar-image"
                  />
                </div>
                <div className="user-info" onClick={() => navigate(`/profile/${user.id}`)}>
                  <strong>{user.displayName || 'Anonymous User'}</strong>
                  <p>{user.bio || 'No bio available'}</p>
                  <div className="user-details">
                    {user.role && <span className="user-role">{user.role}</span>}
                    {user.location && <span className="user-location"><MapPin size={12} />{user.location}</span>}
                    {user.sport && <span className="user-sport"><Target size={12} />{user.sport}</span>}
                    {user.sex && <span className="user-sex">{user.sex}</span>}
                    {user.age && <span className="user-age"><Calendar size={12} />{user.age} years</span>}
                  </div>
                  {user.email && <span className="user-email">{user.email}</span>}
                </div>
                <div className="user-actions">
                  <div className="social-actions">
                    {(() => {
                      // Debug logging for search button state
                      console.log('🔘 Search button state for user:', user.displayName, {
                        userId: user.id,
                        isFriend,
                        requestStatus,
                        friendshipsCount: friendships.length,
                        sentRequestsCount: sentRequests.length,
                        allFriendships: friendships.map(f => ({id: f.id, user1: f.user1, user2: f.user2}))
                      });
                      
                      if (isFriend) {
                        return (
                          <button className="friend-btn" disabled>
                            <Check size={16} />
                            Friends
                          </button>
                        );
                      } else if (requestStatus === 'pending') {
                        return (
                          <button 
                            className="cancel-btn"
                            onClick={() => handleSendFriendRequest(user.id, user.displayName || 'Anonymous User', user.photoURL)}
                          >
                            <X size={16} />
                            Cancel Request
                          </button>
                        );
                      } else {
                        // Default case: not friends and no pending request
                        return (
                          <button 
                            className="add-friend-btn"
                            onClick={() => handleSendFriendRequest(user.id, user.displayName || 'Anonymous User', user.photoURL)}
                          >
                            <UserPlus size={16} />
                            Add Friend
                          </button>
                        );
                      }
                    })()}
                    
                    <button 
                      className={`follow-btn ${isFollowing ? 'following' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(user.id, user.displayName || 'Anonymous User');
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <FooterNav />
    </div>
  );
}
