import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { MessageSquare, UserPlus, Check, X, Send, Users, Edit3, Trash2, Save, XCircle, AlertTriangle, Bell, Heart, Play } from 'lucide-react';
import FooterNav from '../../components/layout/FooterNav';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import { filterChatMessage, getChatViolationMessage, logChatViolation } from '../../utils/content/chatFilter';
import './Messages.css';

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

interface Friend {
  id: string;
  displayName?: string;
  photoURL?: string;
  friendshipId: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderPhoto: string;
  message: string;
  timestamp: any;
  read: boolean;
  edited: boolean;
  editedAt?: any;
  deletedFor: string[];
}

interface Notification {
  id: string;
  type: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  receiverId: string;
  message: string;
  read: boolean;
  timestamp: any;
  postId?: string;
  storyId?: string;
  url?: string;
}

interface FilterResult {
  isClean: boolean;
  shouldBlock?: boolean;
  shouldWarn?: boolean;
  shouldFlag?: boolean;
  violations: string[];
  categories?: string[];
  maxSeverity?: string | null;
}

type TabType = 'friends' | 'requests' | 'notifications';

export default function Messages() {
  const navigate = useNavigate();
  const { currentUser, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedChat, setSelectedChat] = useState<Friend | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [messageViolation, setMessageViolation] = useState<FilterResult | null>(null);
  const [showMessageWarning, setShowMessageWarning] = useState<boolean>(false);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [followingUser, setFollowingUser] = useState<string | null>(null);

  useEffect(() => {
    console.log('📱 Messages: Initializing component', { currentUser: !!currentUser, isGuest: isGuest() });
    
    if (currentUser && !isGuest()) {
      try {
        console.log('📱 Messages: Setting up listeners for user:', currentUser.uid);
        const unsubscribeFriendRequests = fetchFriendRequests();
        const unsubscribeFriends = fetchFriends();
        const unsubscribeMessages = fetchMessages();
        fetchFollowedUsers();
        const unsubscribeNotifications = fetchNotifications();
        
        // Set loading to false after a brief delay to allow data to load
        setTimeout(() => {
          console.log('📱 Messages: Setting loading to false');
          setLoading(false);
        }, 1000);
        
        // Return cleanup function
        return () => {
          if (unsubscribeFriendRequests) unsubscribeFriendRequests();
          if (unsubscribeFriends) unsubscribeFriends();
          if (unsubscribeMessages) unsubscribeMessages();
          if (unsubscribeNotifications) unsubscribeNotifications();
        };
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    } else {
      console.log('📱 Messages: Guest user or no user, setting loading to false');
      setLoading(false);
    }
  }, [currentUser, isGuest]);

  // Listen for friendship changes from other components
  useEffect(() => {
    const handleFriendshipChange = () => {
      // Force refresh of friends data
      if (currentUser && !isGuest()) {
        // Clear current friends immediately
        setFriends([]);
        
        // Refresh from database with delay
        setTimeout(() => {
          fetchFriends();
          fetchFriendRequests();
        }, 500);
      }
    };

    window.addEventListener('friendshipChanged', handleFriendshipChange);
    
    return () => {
      window.removeEventListener('friendshipChanged', handleFriendshipChange);
    };
  }, [currentUser]);

  // Mark all notifications as read when notifications tab is opened
  useEffect(() => {
    if (activeTab === 'notifications' && currentUser && !isGuest() && notifications.length > 0) {
      console.log('📱 Notifications tab opened, marking all as read...');
      // Add a small delay to ensure notifications are loaded
      const timer = setTimeout(() => {
        markAllNotificationsAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, notifications, currentUser]);

  // Handle notification click - mark as read and redirect
  const handleNotificationClick = async (notification: Notification): Promise<void> => {
    try {
      // Mark notification as read
      await markNotificationAsRead(notification.id);
      
      // Redirect based on notification type
      if (notification.type === 'like' || notification.type === 'comment') {
        // Redirect to the specific post detail page
        if (notification.postId) {
          console.log('📱 Redirecting to post detail:', notification.postId);
          navigate(`/post/${notification.postId}`);
        } else if (notification.url) {
          // Fallback to URL if postId not available
          const url = notification.url.startsWith('/') ? notification.url : `/${notification.url}`;
          navigate(url);
        }
      } else if (notification.type === 'story_like' || notification.type === 'story_view' || notification.type === 'story_comment') {
        // Redirect to the specific story page
        if (notification.storyId) {
          console.log('📱 Redirecting to story:', notification.storyId);
          navigate(`/story/${notification.storyId}`);
        } else if (notification.url) {
          // Fallback to URL if storyId not available
          const url = notification.url.startsWith('/') ? notification.url : `/${notification.url}`;
          navigate(url);
        }
      } else if (notification.type === 'follow') {
        // Redirect to the follower's profile
        if (notification.senderId) {
          console.log('📱 Redirecting to profile:', notification.senderId);
          navigate(`/profile/${notification.senderId}`);
        }
      } else if (notification.type === 'friend_request') {
        // Stay on messages page but switch to requests tab
        console.log('📱 Switching to requests tab');
        setActiveTab('requests');
      } else {
        console.log('📱 Unknown notification type:', notification.type);
      }
      
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const fetchFriendRequests = () => {
    if (!currentUser) return;
    
    console.log('📱 Messages: Setting up friend requests listener');
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      console.log('📱 Messages: Friend requests updated:', requests.length);
      setFriendRequests(requests);
    });

    return unsubscribe;
  };

  const fetchFriends = () => {
    if (!currentUser) return;
    
    console.log('📱 Messages: Setting up friends listener');
    
    const q1 = query(
      collection(db, 'friendships'),
      where('user1', '==', currentUser.uid)
    );
    const q2 = query(
      collection(db, 'friendships'),
      where('user2', '==', currentUser.uid)
    );
    
    // Debounce updates to prevent duplicate calls
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Function to combine results from both queries with deduplication
    async function updateFriendsList() {
      // Clear any pending updates
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      // Debounce the update by 100ms to prevent race conditions
      updateTimeout = setTimeout(async () => {
        try {
          const friendsList: Friend[] = [];
          const addedFriendIds = new Set<string>(); // Track added friends to prevent duplicates
          
          // Get friendships where current user is user1
          const snapshot1 = await getDocs(q1);
          
          for (const docSnap of snapshot1.docs) {
            const friendship = docSnap.data();
            const friendId = friendship.user2;
            
            // Skip if already added
            if (addedFriendIds.has(friendId)) {
              console.log('🔄 Skipping duplicate friend:', friendId);
              continue;
            }
            
            try {
              const friendDoc = await getDoc(doc(db, 'users', friendId));
              if (friendDoc.exists()) {
                const friendData: Friend = {
                  id: friendId,
                  ...friendDoc.data(),
                  friendshipId: docSnap.id
                } as Friend;
                friendsList.push(friendData);
                addedFriendIds.add(friendId);
              } else {
                console.warn('⚠️ Friend document not found for ID:', friendId);
              }
            } catch (error) {
              console.error('❌ Error fetching friend profile:', error);
            }
          }
          
          // Get friendships where current user is user2
          const snapshot2 = await getDocs(q2);
          
          for (const docSnap of snapshot2.docs) {
            const friendship = docSnap.data();
            const friendId = friendship.user1;
            
            // Skip if already added
            if (addedFriendIds.has(friendId)) {
              console.log('🔄 Skipping duplicate friend:', friendId);
              continue;
            }
            
            try {
              const friendDoc = await getDoc(doc(db, 'users', friendId));
              if (friendDoc.exists()) {
                const friendData: Friend = {
                  id: friendId,
                  ...friendDoc.data(),
                  friendshipId: docSnap.id
                } as Friend;
                friendsList.push(friendData);
                addedFriendIds.add(friendId);
              } else {
                console.warn('⚠️ Friend document not found for ID:', friendId);
              }
            } catch (error) {
              console.error('❌ Error fetching friend profile:', error);
            }
          }
          
          console.log('📱 Messages: Friends list updated:', friendsList.length, 'unique friends');
          console.log('📱 Messages: Added friend IDs:', Array.from(addedFriendIds));
          setFriends(friendsList);
        } catch (error) {
          console.error('❌ Error in updateFriendsList:', error);
        }
      }, 100);
    }
    
    const unsubscribe1 = onSnapshot(q1, () => updateFriendsList());
    const unsubscribe2 = onSnapshot(q2, () => updateFriendsList());
    
    // Update friends list initially
    updateFriendsList();
    
    // Return cleanup function
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      unsubscribe1();
      unsubscribe2();
    };
  };

  const fetchMessages = () => {
    if (!currentUser) return;
    
    console.log('📱 Messages: Setting up messages listener');
    
    // Query for messages where current user is receiver
    const q1 = query(
      collection(db, 'messages'),
      where('receiverId', '==', currentUser.uid)
    );
    
    // Query for messages where current user is sender
    const q2 = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );
    
    const updateMessages = async () => {
      try {
        const messagesList: Message[] = [];
        
        // Get messages where user is receiver
        const snapshot1 = await getDocs(q1);
        console.log('📱 Messages: Received messages:', snapshot1.size);
        snapshot1.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() } as Message);
        });
        
        // Get messages where user is sender
        const snapshot2 = await getDocs(q2);
        console.log('📱 Messages: Sent messages:', snapshot2.size);
        snapshot2.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() } as Message);
        });
        
        // Remove duplicates (shouldn't happen but just in case)
        const uniqueMessages = messagesList.filter((msg, index, arr) => 
          arr.findIndex(m => m.id === msg.id) === index
        );
        
        // Sort by timestamp, newest first
        uniqueMessages.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(0);
          const timeB = b.timestamp?.toDate?.() || new Date(0);
          return timeA.getTime() - timeB.getTime(); // Changed to oldest first for chat display
        });
        
        console.log('📱 Messages: Total unique messages:', uniqueMessages.length);
        setMessages(uniqueMessages);
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };
    
    // Initial load
    updateMessages();
    
    // Listen for changes in both collections
    const unsubscribe1 = onSnapshot(q1, () => {
      updateMessages();
    });
    const unsubscribe2 = onSnapshot(q2, () => {
      updateMessages();
    });
    
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  };

  const fetchNotifications = () => {
    if (!currentUser) return;
    
    console.log('🔍 Setting up notifications listener for user:', currentUser.uid);
    
    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📱 Notifications snapshot received, docs count:', snapshot.docs.length);
      
      const notificationsList: Notification[] = [];
      let unreadCount = 0;
      
      snapshot.forEach((doc) => {
        const notificationData = { id: doc.id, ...doc.data() } as Notification;
        console.log('📋 Processing notification:', {
          id: doc.id,
          type: notificationData.type,
          senderName: notificationData.senderName,
          message: notificationData.message,
          read: notificationData.read,
          receiverId: notificationData.receiverId,
          timestamp: notificationData.timestamp
        });
        notificationsList.push(notificationData);
        
        if (!notificationData.read) {
          unreadCount++;
        }
      });
      
      console.log('📱 Notifications processed:', {
        total: notificationsList.length,
        unread: unreadCount,
        notifications: notificationsList.map(n => ({ 
          id: n.id, 
          type: n.type, 
          read: n.read,
          senderName: n.senderName,
          message: n.message
        }))
      });
      
      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return timeB.getTime() - timeA.getTime();
      });
      
      console.log('📱 Setting notifications state with', notificationsList.length, 'items');
      setNotifications(notificationsList);
    }, (error) => {
      console.error('❌ Error in notifications listener:', error);
    });
    
    return unsubscribe;
  };

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true // Changed from isRead to read to match Firestore indexes
      });
      console.log('📝 Marked notification as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };


  // Mark all notifications as read when notifications tab is opened
  const markAllNotificationsAsRead = async (): Promise<void> => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        console.log('📝 No unread notifications to mark');
        return;
      }

      console.log('📝 Marking notifications as read:', {
        count: unreadNotifications.length,
        ids: unreadNotifications.map(n => n.id)
      });
      
      // Update all unread notifications
      const updatePromises = unreadNotifications.map(notification => {
        console.log(`📝 Marking notification ${notification.id} as read`);
        return updateDoc(doc(db, 'notifications', notification.id), {
          read: true
        });
      });
      
      await Promise.all(updatePromises);
      console.log('✅ All notifications marked as read successfully');
      
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string): Promise<void> => {
    if (isGuest()) {
      alert('Please sign up or log in to accept friend requests');
      return;
    }

    try {
      console.log('🎯 Accepting friend request:', {
        requestId,
        senderId,
        currentUserId: currentUser?.uid
      });

      // Update request status
      console.log('📝 Updating friend request status to accepted...');
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      console.log('✅ Friend request status updated');

      // Create friendship entries for both users
      console.log('🤝 Creating friendship document...');
      const friendshipData = {
        user1: currentUser!.uid,
        user2: senderId,
        createdAt: serverTimestamp()
      };
      console.log('📋 Friendship data:', friendshipData);
      
      const friendshipRef = await addDoc(collection(db, 'friendships'), friendshipData);
      console.log('✅ Friendship created with ID:', friendshipRef.id);

      alert('Friend request accepted! Check the Friends tab.');

    } catch (error: any) {
      console.error('❌ Error accepting friend request:', error);
      alert('Error accepting friend request: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId: string): Promise<void> => {
    if (isGuest()) {
      alert('Please sign up or log in to manage friend requests');
      return;
    }

    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  // Auto-scroll to bottom function
  const scrollToBottom = (): void => {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, selectedChat]);

  // Real-time message content filtering as user types
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newMessageText = e.target.value;
    setNewMessage(newMessageText);
    
    // Real-time filter check (strict for messages)
    if (newMessageText.trim().length > 3) { // Check after minimal content
      console.log('🔍 Real-time message filter check:', newMessageText);
      const filterResult = filterChatMessage(newMessageText, {
        checkPatterns: true,
        languages: ['english', 'hindi']
      });
      
      console.log('Real-time filter result:', filterResult);
      
      if (!filterResult.isClean && filterResult.shouldBlock) {
        setMessageViolation(filterResult);
        setShowMessageWarning(true);
      } else {
        setMessageViolation(null);
        setShowMessageWarning(false);
      }
    } else {
      setMessageViolation(null);
      setShowMessageWarning(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || isGuest() || sendingMessage || !currentUser) return;

    const messageText = newMessage.trim();
    
    // Content filtering check for messages
    console.log('🔍 Checking message content for inappropriate material...', messageText);
    const filterResult = filterChatMessage(messageText, {
      checkPatterns: true,
      languages: ['english', 'hindi']
    });
    
    console.log('Message filter result:', filterResult);
    
    if (!filterResult.isClean) {
      setMessageViolation(filterResult);
      setShowMessageWarning(true);
      
      // Log violation for admin review
      if (filterResult.shouldFlag) {
        await logChatViolation(currentUser.uid, messageText, filterResult.violations, 'chat');
        console.log('🚨 Message violation flagged for admin review');
      }
      
      // Block content without confirmation - just show error
      if (filterResult.shouldBlock || filterResult.shouldWarn) {
        const violationMsg = getChatViolationMessage(filterResult.violations, filterResult.categories);
        alert(`❌ You can't send this message: ${violationMsg}`);
        return; // Don't send the message
      }
    } else {
      setMessageViolation(null);
      setShowMessageWarning(false);
      console.log('✅ Message content passed all filters');
    }

    setSendingMessage(true);
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('📤 Sending message:', {
        senderId: currentUser.uid,
        receiverId: selectedChat.id,
        message: messageText
      });

      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: selectedChat.id,
        senderName: currentUser.displayName || 'Anonymous User',
        senderPhoto: currentUser.photoURL || '',
        message: messageText,
        timestamp: serverTimestamp(),
        read: false,
        edited: false,
        deletedFor: [] // Array to track who deleted the message
      });
      
      console.log('✅ Message sent successfully');
      
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 200);
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      setNewMessage(messageText); // Restore message if failed
      alert('Failed to send message: ' + error.message);
    }
    
    setSendingMessage(false);
  };

  const handleDeleteMessage = async (messageId: string, deleteType: 'me' | 'everyone'): Promise<void> => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        alert('Message not found');
        return;
      }

      const messageData = messageDoc.data() as Message;
      
      if (deleteType === 'everyone') {
        // Only sender can delete for everyone
        if (messageData.senderId !== currentUser?.uid) {
          alert('You can only delete your own messages for everyone');
          return;
        }
        
        // Delete the entire message document
        await deleteDoc(messageRef);
        console.log('🗑️ Message deleted for everyone');
      } else {
        // Delete for me only - add current user to deletedFor array
        const currentDeletedFor = messageData.deletedFor || [];
        if (!currentDeletedFor.includes(currentUser!.uid)) {
          await updateDoc(messageRef, {
            deletedFor: [...currentDeletedFor, currentUser!.uid]
          });
          console.log('🗑️ Message deleted for current user only');
        }
      }
      
      setShowMessageOptions(null);
    } catch (error: any) {
      console.error('❌ Error deleting message:', error);
      alert('Failed to delete message: ' + error.message);
    }
  };

  const handleEditMessage = async (messageId: string): Promise<void> => {
    if (!editText.trim()) {
      alert('Message cannot be empty');
      return;
    }

    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        message: editText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });
      
      setEditingMessage(null);
      setEditText('');
      setShowMessageOptions(null);
      console.log('✏️ Message edited successfully');
    } catch (error: any) {
      console.error('❌ Error editing message:', error);
      alert('Failed to edit message: ' + error.message);
    }
  };

  const startEdit = (message: Message): void => {
    setEditingMessage(message.id);
    setEditText(message.message);
    setShowMessageOptions(null);
  };

  const cancelEdit = (): void => {
    setEditingMessage(null);
    setEditText('');
  };

  // Long press handlers
  const handleMouseDown = (message: Message): void => {
    if (!message.senderId || message.senderId !== currentUser?.uid) return;
    
    const timer = setTimeout(() => {
      setShowMessageOptions(message.id);
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = (): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = (message: Message): void => {
    if (!message.senderId || message.senderId !== currentUser?.uid) return;
    
    const timer = setTimeout(() => {
      setShowMessageOptions(message.id);
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = (): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (showMessageOptions && !(event.target as Element).closest('.message')) {
        setShowMessageOptions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [showMessageOptions]);

  // Fetch users that current user is following
  const fetchFollowedUsers = (): (() => void) | undefined => {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Guest view
  if (isGuest()) {
    return (
      <div className="messages">
        <nav className="nav-bar">
          <div className="nav-content">
            <h1>Messages</h1>
            <div className="nav-controls">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="main-content messages-content">
          <div className="guest-restriction">
            <div className="guest-restriction-content">
              <MessageSquare size={48} />
              <h2>Messages & Friend Requests</h2>
              <p>🔒 Guest accounts cannot access messaging features</p>
              <p>Sign up to connect with friends and send messages!</p>
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

  if (loading) {
    return (
      <div className="messages">
        <nav className="nav-bar">
          <div className="nav-content">
            <h1>Messages</h1>
          </div>
        </nav>
        <div className="main-content">
          <div className="loading">Loading messages...</div>
        </div>
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="messages">
      <nav className="nav-bar">
        <div className="nav-content">
          <h1>Messages</h1>
          <div className="nav-controls">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="main-content messages-content">
        <div className="messages-tabs">
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users size={20} />
            Friends ({friends.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus size={20} />
            Requests ({friendRequests.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            Notifications ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>No Friends Yet</h3>
                <p>Accept friend requests to start chatting!</p>
              </div>
            ) : (
              <>
                {!selectedChat && (
                  <div className="friends-grid">
                    {friends.map((friend) => (
                      <div 
                        key={friend.id} 
                        className="friend-card"
                        onClick={() => setSelectedChat(friend)}
                      >
                        <img 
                          src={friend.photoURL || 'https://via.placeholder.com/50'} 
                          alt={friend.displayName}
                        />
                        <div className="friend-info">
                          <strong>{friend.displayName || 'Anonymous User'}</strong>
                          {friend.isOnline && <span className="online-indicator">● Online</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedChat && (
                  <div className="chat-container">
                    <div className="chat-header">
                      <button className="back-btn" onClick={() => setSelectedChat(null)}>
                        ← Back
                      </button>
                      <img 
                        src={selectedChat.photoURL || 'https://via.placeholder.com/40'} 
                        alt={selectedChat.displayName}
                      />
                      <strong>{selectedChat.displayName || 'Anonymous User'}</strong>
                    </div>

                    <div className="chat-messages" id="chat-messages">
                      {messages
                        .filter(msg => 
                          (msg.senderId === currentUser?.uid && msg.receiverId === selectedChat.id) ||
                          (msg.senderId === selectedChat.id && msg.receiverId === currentUser?.uid)
                        )
                        .filter(msg => !msg.deletedFor.includes(currentUser!.uid))
                        .map((message) => (
                          <div 
                            key={message.id} 
                            className={`message ${message.senderId === currentUser?.uid ? 'sent' : 'received'}`}
                            onMouseDown={() => handleMouseDown(message)}
                            onMouseUp={handleMouseUp}
                            onTouchStart={() => handleTouchStart(message)}
                            onTouchEnd={handleTouchEnd}
                          >
                            {editingMessage === message.id ? (
                              <div className="edit-message-form">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  autoFocus
                                />
                                <div className="edit-actions">
                                  <button onClick={() => handleEditMessage(message.id)}>
                                    <Save size={16} />
                                  </button>
                                  <button onClick={cancelEdit}>
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p>{message.message}</p>
                                {message.edited && <span className="edited-indicator">(edited)</span>}
                                <span className="message-time">
                                  {message.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {showMessageOptions === message.id && message.senderId === currentUser?.uid && (
                                  <div className="message-options">
                                    <button onClick={() => startEdit(message)}>
                                      <Edit3 size={16} />
                                      Edit
                                    </button>
                                    <button onClick={() => handleDeleteMessage(message.id, 'me')}>
                                      <Trash2 size={16} />
                                      Delete for me
                                    </button>
                                    <button onClick={() => handleDeleteMessage(message.id, 'everyone')}>
                                      <Trash2 size={16} />
                                      Delete for everyone
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                    </div>

                    <form className="chat-input" onSubmit={handleSendMessage}>
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleMessageChange}
                        disabled={sendingMessage}
                      />
                      <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                        <Send size={20} />
                      </button>
                    </form>

                    {showMessageWarning && messageViolation && (
                      <div className="message-warning">
                        <AlertTriangle size={16} />
                        <span>This message contains inappropriate content</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="friend-requests-list">
            {friendRequests.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={48} />
                <h3>No Friend Requests</h3>
                <p>You don't have any pending friend requests</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="friend-request-card">
                  <img 
                    src={request.senderPhoto || 'https://via.placeholder.com/50'} 
                    alt={request.senderName}
                  />
                  <div className="request-info">
                    <strong>{request.senderName}</strong>
                    <p>wants to be your friend</p>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => handleAcceptRequest(request.id, request.senderId)}
                    >
                      <Check size={16} />
                      Accept
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={48} />
                <h3>No Notifications</h3>
                <p>You don't have any notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.type === 'like' && <Heart size={20} />}
                    {notification.type === 'comment' && <MessageSquare size={20} />}
                    {notification.type === 'follow' && <UserPlus size={20} />}
                    {notification.type === 'story_like' && <Heart size={20} />}
                    {notification.type === 'story_view' && <Play size={20} />}
                    {notification.type === 'friend_request' && <UserPlus size={20} />}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      <img 
                        src={notification.senderPhotoURL || 'https://via.placeholder.com/40'} 
                        alt={notification.senderName}
                      />
                      <div className="notification-text">
                        <strong>{notification.senderName}</strong>
                        <p>{notification.message}</p>
                      </div>
                    </div>
                    <span className="notification-time">
                      {notification.timestamp?.toDate?.().toLocaleString()}
                    </span>
                  </div>
                  {!notification.read && <div className="unread-indicator"></div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <FooterNav />
    </div>
  );
}
