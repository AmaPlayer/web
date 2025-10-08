// Push Notification Service for AmaPlayer
import { messaging, getToken, onMessage } from '../lib/firebase';
import { db } from '../lib/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { Messaging } from 'firebase/messaging';
import { Post } from '../types/models/post';
import { Story } from '../types/models/story';

/**
 * Notification type
 */
type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'follow' 
  | 'message' 
  | 'story_like' 
  | 'story_view' 
  | 'story_comment' 
  | 'friend_request'
  | 'share_to_friend'
  | 'share_to_group'
  | 'post_shared';

/**
 * Notification data structure
 */
interface NotificationData {
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  type: NotificationType;
  message: string;
  title?: string;
  postId?: string | null;
  storyId?: string | null;
  groupId?: string;
  url?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Share data structure
 */
interface ShareData {
  sharerId: string;
  sharerName?: string;
  sharerPhotoURL?: string;
  shareType: string;
  targets: string[];
  message?: string;
  postId: string;
  originalAuthorId: string;
}

/**
 * Group data structure
 */
interface GroupData {
  name: string;
  members: string[];
  [key: string]: unknown;
}

/**
 * Notification Service class
 */
class NotificationService {
  private token: string | null = null;
  private isSupported: boolean = false;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if notifications are supported
      this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && !!messaging;
      
      if (!this.isSupported) {
        console.log('🔔 Push notifications not supported');
        this.initialized = true;
        return;
      }

      // Check existing permission without requesting
      const permission = Notification.permission;
      console.log('🔔 Current notification permission:', permission);
      
      if (permission === 'granted') {
        await this.getAndSaveToken();
      }
      
      // Set up foreground message listener
      this.setupForegroundListener();
      this.initialized = true;
      
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.initialized = true;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      // Only request if permission is not already decided
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission requested:', permission);
        
        if (permission === 'granted') {
          await this.getAndSaveToken();
        } else {
          console.log('🚫 Notification permission denied');
        }
        
        return permission;
      } else {
        console.log('🔔 Notification permission already set:', Notification.permission);
        return Notification.permission;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async enableNotifications(userId?: string): Promise<boolean> {
    try {
      console.log('🔔 User requested to enable notifications');
      const permission = await this.requestPermission();
      
      if (permission === 'granted') {
        await this.initialize();
        
        if (userId) {
          await this.getAndSaveToken(userId);
        }
        
        console.log('✅ In-app notifications enabled');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  async getAndSaveToken(userId: string | null = null): Promise<string | null> {
    try {
      if (!messaging) {
        console.log('Messaging not available');
        return null;
      }

      const vapidKey = process.env.REACT_APP_VAPID_KEY;
      if (!vapidKey || vapidKey === 'your-vapid-key-here' || vapidKey.length < 80) {
        console.log('⚠️ VAPID key not configured properly - push notifications disabled');
        return null;
      }

      const fcmToken = await getToken(messaging as Messaging, {
        vapidKey: vapidKey
      });

      if (fcmToken) {
        console.log('🔔 FCM Token received:', fcmToken.substring(0, 20) + '...');
        this.token = fcmToken;
        
        if (userId) {
          await this.saveTokenToDatabase(userId, fcmToken);
        }
        
        return fcmToken;
      } else {
        console.log('🚫 No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const existingTokens = (userData.fcmTokens as string[]) || [];
        
        if (!existingTokens.includes(token)) {
          existingTokens.push(token);
          await setDoc(userRef, { 
            fcmTokens: existingTokens,
            lastTokenUpdate: serverTimestamp()
          }, { merge: true });
          
          console.log('🔔 FCM token saved to database');
        }
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  setupForegroundListener(): void {
    if (!messaging) return;

    onMessage(messaging as Messaging, (payload) => {
      console.log('🔔 Foreground message received:', payload);
      
      this.showCustomNotification({
        title: payload.notification?.title || 'AmaPlayer',
        body: payload.notification?.body || 'You have a new notification',
        icon: '/logo192.png',
        data: payload.data
      });
    });
  }

  showCustomNotification({ title, body, icon, data }: { 
    title: string; 
    body: string; 
    icon: string; 
    data?: Record<string, unknown>; 
  }): void {
    if (!this.isSupported) return;

    const notification = new Notification(title, {
      body,
      icon,
      badge: '/logo192.png',
      tag: 'amaplayer-notification',
      data,
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      
      if (data?.url && typeof data.url === 'string') {
        window.location.href = data.url;
      }
    };

    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  async sendNotificationToUser(receiverUserId: string, notification: NotificationData): Promise<void> {
    try {
      console.log('🔔 Creating notification for user:', receiverUserId, notification);
      
      const notificationData = {
        receiverId: receiverUserId,
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderPhotoURL: notification.senderPhotoURL || '',
        type: notification.type,
        message: notification.message,
        postId: notification.postId || null,
        storyId: notification.storyId || null,
        timestamp: serverTimestamp(),
        read: false,
        pushData: {
          title: notification.title || 'AmaPlayer',
          body: notification.message,
          icon: '/logo192.png',
          url: notification.url || '/',
          ...notification.data
        }
      };

      const notificationDoc = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('✅ Notification successfully created with ID:', notificationDoc.id);
      
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  async sendLikeNotification(
    likerUserId: string, 
    likerName: string, 
    likerPhotoURL: string, 
    postOwnerUserId: string, 
    postId: string, 
    postData: Partial<Post> | null = null
  ): Promise<void> {
    if (likerUserId === postOwnerUserId) return;

    await this.sendNotificationToUser(postOwnerUserId, {
      senderId: likerUserId,
      senderName: likerName,
      senderPhotoURL: likerPhotoURL,
      type: 'like',
      message: `${likerName} liked your post`,
      title: 'New Like! ❤️',
      postId: postId,
      url: `/post/${postId}`,
      postMediaUrl: postData?.mediaUrl,
      postMediaType: postData?.mediaType,
      postCaption: postData?.caption,
      data: {
        postId: postId,
        type: 'like'
      }
    });
  }

  async sendCommentNotification(
    commenterUserId: string, 
    commenterName: string, 
    commenterPhotoURL: string, 
    postOwnerUserId: string, 
    postId: string, 
    commentText: string, 
    postData: Partial<Post> | null = null
  ): Promise<void> {
    if (commenterUserId === postOwnerUserId) return;

    await this.sendNotificationToUser(postOwnerUserId, {
      senderId: commenterUserId,
      senderName: commenterName,
      senderPhotoURL: commenterPhotoURL,
      type: 'comment',
      message: `${commenterName} commented: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
      title: 'New Comment! 💬',
      postId: postId,
      url: `/post/${postId}`,
      postMediaUrl: postData?.mediaUrl,
      postMediaType: postData?.mediaType,
      postCaption: postData?.caption,
      data: {
        postId: postId,
        type: 'comment'
      }
    });
  }

  async sendStoryLikeNotification(
    likerUserId: string, 
    likerName: string, 
    likerPhotoURL: string, 
    storyOwnerUserId: string, 
    storyId: string, 
    storyData: Partial<Story> | null = null
  ): Promise<void> {
    if (likerUserId === storyOwnerUserId) return;

    await this.sendNotificationToUser(storyOwnerUserId, {
      senderId: likerUserId,
      senderName: likerName,
      senderPhotoURL: likerPhotoURL,
      type: 'story_like',
      message: `${likerName} liked your story`,
      title: 'Story Like! ❤️',
      storyId: storyId,
      url: `/story/${storyId}`,
      storyMediaUrl: storyData?.mediaUrl,
      storyMediaType: storyData?.mediaType,
      storyThumbnail: storyData?.thumbnail,
      storyCaption: storyData?.caption,
      data: {
        storyId: storyId,
        type: 'story_like'
      }
    });
  }

  async sendFollowNotification(
    followerUserId: string, 
    followerName: string, 
    followerPhotoURL: string, 
    followedUserId: string
  ): Promise<void> {
    await this.sendNotificationToUser(followedUserId, {
      senderId: followerUserId,
      senderName: followerName,
      senderPhotoURL: followerPhotoURL,
      type: 'follow',
      message: `${followerName} started following you`,
      title: 'New Follower! 👥',
      url: `/profile/${followerUserId}`,
      data: {
        userId: followerUserId,
        type: 'follow'
      }
    });
  }

  async sendShareNotifications(
    shareData: ShareData, 
    postData: Partial<Post>, 
    additionalData: { groupsData?: Record<string, GroupData> } = {}
  ): Promise<void> {
    try {
      const { 
        sharerId, 
        sharerName = 'Someone', 
        sharerPhotoURL = '', 
        shareType, 
        targets, 
        message = '', 
        postId, 
        originalAuthorId 
      } = shareData;

      // Send notification to original post author
      if (originalAuthorId && originalAuthorId !== sharerId) {
        await this.sendPostSharedNotification(
          sharerId, 
          sharerName, 
          sharerPhotoURL, 
          originalAuthorId, 
          postId, 
          shareType, 
          message, 
          postData
        );
      }

      // Send notifications based on share type
      switch (shareType) {
        case 'friends':
          await this.sendShareToFriendsNotifications(
            sharerId, 
            sharerName, 
            sharerPhotoURL, 
            targets, 
            postId, 
            message, 
            postData
          );
          break;

        case 'groups':
          if (additionalData.groupsData) {
            for (const groupId of targets) {
              const groupData = additionalData.groupsData[groupId];
              if (groupData && groupData.members) {
                await this.sendShareToGroupNotification(
                  sharerId, 
                  sharerName, 
                  sharerPhotoURL, 
                  groupId, 
                  groupData.members, 
                  postId, 
                  message, 
                  postData, 
                  groupData
                );
              }
            }
          }
          break;

        case 'feed':
          console.log('📰 Feed share notification sent to original author');
          break;

        default:
          console.warn('⚠️ Unknown share type for notifications:', shareType);
      }

      console.log('✅ All share notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending share notifications:', error);
    }
  }

  private async sendShareToFriendsNotifications(
    sharerId: string, 
    sharerName: string, 
    sharerPhotoURL: string, 
    friendIds: string[], 
    postId: string, 
    message: string, 
    postData: Partial<Post>
  ): Promise<void> {
    if (!friendIds || friendIds.length === 0) return;

    const notifications = friendIds.map(friendId => ({
      receiverId: friendId,
      senderId: sharerId,
      senderName: sharerName,
      senderPhotoURL: sharerPhotoURL,
      type: 'share_to_friend' as NotificationType,
      message: message 
        ? `${sharerName} shared a post with you: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
        : `${sharerName} shared a post with you`,
      title: 'Post Shared! 📤',
      postId: postId,
      url: `/post/${postId}`,
      postMediaUrl: postData?.mediaUrl,
      postMediaType: postData?.mediaType,
      postCaption: postData?.caption,
      shareMessage: message,
      data: {
        postId: postId,
        type: 'share_to_friend',
        shareMessage: message
      }
    }));

    const batchSize = 10;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(notification => this.sendNotificationToUser(notification.receiverId, notification))
      );
      
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Sent ${notifications.length} share notifications to friends`);
  }

  private async sendShareToGroupNotification(
    sharerId: string, 
    sharerName: string, 
    sharerPhotoURL: string, 
    groupId: string, 
    groupMemberIds: string[], 
    postId: string, 
    message: string, 
    postData: Partial<Post>, 
    groupData: GroupData
  ): Promise<void> {
    const membersToNotify = groupMemberIds.filter(memberId => memberId !== sharerId);
    if (membersToNotify.length === 0) return;

    const groupName = groupData.name || 'a group';
    
    const notifications = membersToNotify.map(memberId => ({
      receiverId: memberId,
      senderId: sharerId,
      senderName: sharerName,
      senderPhotoURL: sharerPhotoURL,
      type: 'share_to_group' as NotificationType,
      message: message 
        ? `${sharerName} shared a post in ${groupName}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
        : `${sharerName} shared a post in ${groupName}`,
      title: 'New Group Share! 👥',
      postId: postId,
      groupId: groupId,
      url: `/post/${postId}?group=${groupId}`,
      postMediaUrl: postData?.mediaUrl,
      postMediaType: postData?.mediaType,
      postCaption: postData?.caption,
      shareMessage: message,
      groupName: groupName,
      data: {
        postId: postId,
        groupId: groupId,
        type: 'share_to_group',
        shareMessage: message
      }
    }));

    const batchSize = 15;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(notification => this.sendNotificationToUser(notification.receiverId, notification))
      );
      
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    console.log(`✅ Sent ${notifications.length} group share notifications`);
  }

  private async sendPostSharedNotification(
    sharerId: string, 
    sharerName: string, 
    sharerPhotoURL: string, 
    postAuthorId: string, 
    postId: string, 
    shareType: string, 
    message: string, 
    postData: Partial<Post>
  ): Promise<void> {
    if (sharerId === postAuthorId) return;

    let shareTypeText = '';
    let icon = '📤';
    
    switch (shareType) {
      case 'friends':
        shareTypeText = 'with friends';
        icon = '👥';
        break;
      case 'feed':
        shareTypeText = 'to their feed';
        icon = '📰';
        break;
      case 'groups':
        shareTypeText = 'in groups';
        icon = '🏢';
        break;
      default:
        shareTypeText = '';
    }

    await this.sendNotificationToUser(postAuthorId, {
      senderId: sharerId,
      senderName: sharerName,
      senderPhotoURL: sharerPhotoURL,
      type: 'post_shared',
      message: message 
        ? `${sharerName} shared your post ${shareTypeText}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
        : `${sharerName} shared your post ${shareTypeText}`,
      title: `Your Post Was Shared! ${icon}`,
      postId: postId,
      url: `/post/${postId}`,
      postMediaUrl: postData?.mediaUrl,
      postMediaType: postData?.mediaType,
      postCaption: postData?.caption,
      shareMessage: message,
      shareType: shareType,
      data: {
        postId: postId,
        type: 'post_shared',
        shareType: shareType,
        shareMessage: message
      }
    });

    console.log(`✅ Sent post shared notification to author: ${postAuthorId}`);
  }
}

const notificationService = new NotificationService();

export default notificationService;
