import React from 'react';
import { Notification, NotificationType, NotificationPriority } from '@features/events/types/notification.types';
// TODO: Import from main app notification service
// import { notificationService } from '@services/notificationService';

interface NotificationCenterProps {
  userId: string;
  className?: string;
  maxDisplay?: number;
}

/**
 * NotificationCenter Component
 * In-app notification center with categorization and management
 * Requirements: 1.5, 2.5, 4.2, 7.4
 *
 * TODO: This component needs to be integrated with the main app's notification service
 * Currently disabled until main app notification service is connected
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  className = '',
  maxDisplay = 50
}) => {
  // TODO: Integrate with main app notification service
  return (
    <div className={`notification-center ${className}`}>
      <div className="text-center p-4 text-gray-500">
        Notifications will be integrated with main app
      </div>
    </div>
  );
};

export default NotificationCenter;
