// Safe Comment Component - Bulletproof comment rendering
import React, { memo } from 'react';
import { Trash2 } from 'lucide-react';
import ProfileAvatar from '../ui/ProfileAvatar';
import ErrorBoundary from './ErrorBoundary';
import { 
  ultraSafeCommentData, 
  safenizeString, 
  safeFormatTimestamp,
  SafeComment as SafeCommentData
} from '../../../utils/rendering/safeCommentRenderer';

interface SafeCommentProps {
  comment: unknown;
  index: number;
  currentUserId: string | null;
  onDelete?: (index: number, commentId: string) => void;
  context?: string;
}

/**
 * Bulletproof comment rendering component that prevents React error #31
 */
const SafeComment = memo(function SafeComment({ 
  comment, 
  index, 
  currentUserId, 
  onDelete, 
  context = 'unknown' 
}: SafeCommentProps) {
  // First layer of protection: Safe data extraction
  const safeComment = ultraSafeCommentData(comment);
  
  // Second layer: Emergency fallback for invalid comments
  if (!safeComment.isValid) {
    return (
      <div className="comment error-comment">
        <p className="error-message">Comment could not be loaded safely</p>
      </div>
    );
  }
  
  // Third layer: Individual field protection with emergency fallbacks
  const displayName = safenizeString(safeComment.userDisplayName, 'Unknown User');
  const commentText = safenizeString(safeComment.text, 'No text');
  const userPhoto = safenizeString(safeComment.userPhotoURL, '');
  const userId = safenizeString(safeComment.userId, '');
  const commentId = safenizeString(safeComment.id, `comment-${index}`);
  
  // Debug logging for production issues
  if (process.env.NODE_ENV === 'development') {
    const logger = require('../../../utils/logging/LoggingManager').default;
    logger.rendering(`Rendering safe comment in ${context}:`, {
      id: commentId,
      displayName,
      textLength: commentText.length,
      hasPhoto: !!userPhoto,
      canDelete: userId === currentUserId
    });
  }
  
  return (
    <ErrorBoundary name={`SafeComment-${context}-${index}`}>
      <div className="comment" data-comment-id={commentId}>
        <div className="comment-avatar">
          <ProfileAvatar 
            src={userPhoto} 
            alt={`${displayName} avatar`}
            size={32}
          />
        </div>
        
        <div className="comment-content">
          <div className="comment-header">
            <strong className="comment-author">
              {displayName}
            </strong>
            <span className="comment-time">
              {safeFormatTimestamp(safeComment.timestamp)}
            </span>
          </div>
          <p className="comment-text">
            {commentText}
          </p>
        </div>
        
        {userId === currentUserId && onDelete && (
          <button 
            className="delete-comment-btn"
            onClick={() => onDelete(index, commentId)}
            title="Delete comment"
            aria-label={`Delete comment by ${displayName}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
});

interface SafeCommentsListProps {
  comments: unknown;
  currentUserId: string | null;
  onDelete?: (index: number, commentId: string) => void;
  context?: string;
  emptyMessage?: string;
}

/**
 * Safe Comments List Component - Renders multiple comments safely
 */
export const SafeCommentsList = memo(function SafeCommentsList({ 
  comments, 
  currentUserId, 
  onDelete, 
  context = 'unknown',
  emptyMessage = 'No comments yet. Be the first to comment!'
}: SafeCommentsListProps) {
  // Validate and sanitize comments array
  if (!Array.isArray(comments)) {
    console.warn('⚠️ Comments prop is not an array:', comments);
    return (
      <div className="comments-list">
        <p className="no-comments error">Invalid comments data</p>
      </div>
    );
  }
  
  // Filter out any invalid comments
  const safeComments = comments
    .map(comment => ultraSafeCommentData(comment))
    .filter(comment => comment.isValid);
  
  if (safeComments.length === 0) {
    return (
      <div className="comments-list">
        <p className="no-comments">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="comments-list">
      {safeComments.map((comment: SafeCommentData, index: number) => {
        // Generate stable key to prevent re-renders
        const timestampMillis = comment.timestamp && typeof comment.timestamp === 'object' && 'toMillis' in comment.timestamp
          ? (comment.timestamp as { toMillis: () => number }).toMillis()
          : Date.now();
        const stableKey = comment.id || 
          `${comment.userId || 'unknown'}-${timestampMillis}-${index}`;
        
        return (
          <SafeComment
            key={`${context}-${stableKey}`}
            comment={comment}
            index={index}
            currentUserId={currentUserId}
            onDelete={onDelete}
            context={context}
          />
        );
      })}
    </div>
  );
});

export default SafeComment;
