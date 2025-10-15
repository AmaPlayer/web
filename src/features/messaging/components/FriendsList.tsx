import React from 'react';
import { MessageCircle, Circle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { navigateToProfile } from '../../../utils/navigation/profileNavigation';
import SafeImage from '../../../components/common/SafeImage';
import '../styles/FriendsList.css';

interface Friend {
  id: string;
  displayName?: string;
  photoURL?: string;
  friendshipId: string;
  isOnline?: boolean;
}

interface FriendsListProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
  loading?: boolean;
}

export default function FriendsList({ friends, onSelectFriend, loading }: FriendsListProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleProfileClick = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    navigateToProfile(navigate, friendId, currentUser?.uid);
  };
  if (loading) {
    return (
      <div className="friends-list-container">
        <div className="friends-list-loading">
          <div className="loading-skeleton">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="friend-card-skeleton">
                <div className="friend-avatar-skeleton" />
                <div className="friend-info-skeleton">
                  <div className="friend-name-skeleton" />
                  <div className="friend-status-skeleton" />
                </div>
                <div className="friend-action-skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="friends-list-container">
        <div className="friends-empty-state">
          <MessageCircle size={48} className="empty-icon" />
          <h3>No Friends Yet</h3>
          <p>Accept friend requests to start chatting!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-list-container">
      <div className="friends-list-header">
        <h3>Friends ({friends.length})</h3>
        <p>Tap a friend to start chatting</p>
      </div>
      
      <div className="friends-list-grid">
        {friends.map((friend) => (
          <div 
            key={friend.id} 
            className="friend-card-enhanced"
            onClick={() => onSelectFriend(friend)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectFriend(friend);
              }
            }}
            aria-label={`Start chat with ${friend.displayName || 'Anonymous User'}`}
          >
            <div className="friend-avatar-container">
              <SafeImage 
                src={friend.photoURL || ''} 
                alt={friend.displayName || 'Anonymous User'}
                placeholder="avatar"
                className="friend-avatar-enhanced"
                loading="lazy"
              />
              {friend.isOnline && (
                <div className="online-status-indicator" aria-label="Online">
                  <Circle size={8} fill="currentColor" />
                </div>
              )}
            </div>
            
            <div className="friend-info-enhanced">
              <div 
                className="friend-name clickable-profile-name"
                onClick={(e) => handleProfileClick(e, friend.id)}
                title="View profile"
              >
                {friend.displayName || 'Anonymous User'}
              </div>
              <div className="friend-status">
                {friend.isOnline ? (
                  <span className="status-online">
                    <Circle size={6} fill="currentColor" />
                    Online
                  </span>
                ) : (
                  <span className="status-offline">Offline</span>
                )}
              </div>
            </div>
            
            <div className="friend-actions">
              <button
                className="profile-action-btn"
                onClick={(e) => handleProfileClick(e, friend.id)}
                title="View profile"
                aria-label={`View ${friend.displayName || 'user'}'s profile`}
              >
                <User size={16} />
              </button>
              <div className="friend-action-indicator">
                <MessageCircle size={18} className="chat-icon" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}