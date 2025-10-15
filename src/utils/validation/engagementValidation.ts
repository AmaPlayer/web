// Engagement data validation utilities
import { Post, Like, Comment } from '../../types/models/post';

/**
 * Validated engagement metrics
 */
export interface ValidatedEngagementMetrics {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isValid: boolean;
  errors: string[];
}

/**
 * Engagement data validation result
 */
export interface EngagementValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedData?: Partial<Post>;
}

/**
 * Validate like data structure and count
 */
export function validateLikes(likes: any, likesCount?: number): { isValid: boolean; correctedCount: number; errors: string[] } {
  const errors: string[] = [];
  let correctedCount = 0;

  if (!Array.isArray(likes)) {
    if (likes !== undefined && likes !== null) {
      errors.push('Likes field must be an array');
    }
    likes = [];
  }

  // Validate each like entry
  const validLikes = likes.filter((like: any, index: number) => {
    if (typeof like === 'string') {
      // Legacy format - just user ID
      return like.length > 0;
    } else if (typeof like === 'object' && like !== null) {
      // New format - like object
      if (!like.userId || typeof like.userId !== 'string') {
        errors.push(`Invalid like at index ${index}: missing or invalid userId`);
        return false;
      }
      return true;
    } else {
      errors.push(`Invalid like at index ${index}: must be string or object`);
      return false;
    }
  });

  correctedCount = validLikes.length;

  // Check if provided count matches actual count - warn but don't error
  if (typeof likesCount === 'number' && likesCount !== correctedCount) {
    // Only warn in development, auto-correct in production
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Likes count mismatch for post: provided ${likesCount}, actual ${correctedCount}. Auto-correcting.`);
    }
  }

  return {
    isValid: errors.length === 0,
    correctedCount,
    errors
  };
}

/**
 * Validate comment data structure and count
 */
export function validateComments(comments: any, commentsCount?: number): { isValid: boolean; correctedCount: number; errors: string[] } {
  const errors: string[] = [];
  let correctedCount = 0;

  if (!Array.isArray(comments)) {
    if (comments !== undefined && comments !== null) {
      errors.push('Comments field must be an array');
    }
    comments = [];
  }

  // Validate each comment entry
  const validComments = comments.filter((comment: any, index: number) => {
    if (typeof comment !== 'object' || comment === null) {
      errors.push(`Invalid comment at index ${index}: must be an object`);
      return false;
    }

    const requiredFields = ['id', 'text', 'userId', 'userDisplayName'];
    for (const field of requiredFields) {
      if (!comment[field] || typeof comment[field] !== 'string') {
        errors.push(`Invalid comment at index ${index}: missing or invalid ${field}`);
        return false;
      }
    }

    return true;
  });

  correctedCount = validComments.length;

  // Check if provided count matches actual count - warn but don't error
  if (typeof commentsCount === 'number' && commentsCount !== correctedCount) {
    // Only warn in development, auto-correct in production
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Comments count mismatch for post: provided ${commentsCount}, actual ${correctedCount}. Auto-correcting.`);
    }
  }

  return {
    isValid: errors.length === 0,
    correctedCount,
    errors
  };
}

/**
 * Validate share data structure and count
 */
export function validateShares(shares: any, sharesCount?: number, shareCount?: number): { isValid: boolean; correctedCount: number; errors: string[] } {
  const errors: string[] = [];
  let correctedCount = 0;

  if (!Array.isArray(shares)) {
    if (shares !== undefined && shares !== null) {
      errors.push('Shares field must be an array');
    }
    shares = [];
  }

  // Validate each share entry (should be user IDs)
  const validShares = shares.filter((share: any, index: number) => {
    if (typeof share !== 'string' || share.length === 0) {
      errors.push(`Invalid share at index ${index}: must be a non-empty string (user ID)`);
      return false;
    }
    return true;
  });

  correctedCount = validShares.length;

  // Check if provided counts match actual count - warn but don't error
  if (typeof sharesCount === 'number' && sharesCount !== correctedCount) {
    // Only warn in development, auto-correct in production
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Shares count mismatch for post: provided ${sharesCount}, actual ${correctedCount}. Auto-correcting.`);
    }
  }

  if (typeof shareCount === 'number' && shareCount !== correctedCount) {
    errors.push(`Share count mismatch: provided ${shareCount}, actual ${correctedCount}`);
  }

  return {
    isValid: errors.length === 0,
    correctedCount,
    errors
  };
}

/**
 * Validate all engagement metrics for a post
 */
export function validatePostEngagement(post: any): EngagementValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const correctedData: Partial<Post> = {};

  // Validate likes
  const likesValidation = validateLikes(post.likes, post.likesCount);
  if (!likesValidation.isValid) {
    errors.push(...likesValidation.errors);
  }
  if (post.likesCount !== likesValidation.correctedCount) {
    correctedData.likesCount = likesValidation.correctedCount;
    warnings.push(`Corrected likes count from ${post.likesCount} to ${likesValidation.correctedCount}`);
  }

  // Validate comments
  const commentsValidation = validateComments(post.comments, post.commentsCount);
  if (!commentsValidation.isValid) {
    errors.push(...commentsValidation.errors);
  }
  if (post.commentsCount !== commentsValidation.correctedCount) {
    correctedData.commentsCount = commentsValidation.correctedCount;
    warnings.push(`Corrected comments count from ${post.commentsCount} to ${commentsValidation.correctedCount}`);
  }

  // Validate shares
  const sharesValidation = validateShares(post.shares, post.sharesCount, post.shareCount);
  if (!sharesValidation.isValid) {
    errors.push(...sharesValidation.errors);
  }
  if (post.sharesCount !== sharesValidation.correctedCount) {
    correctedData.sharesCount = sharesValidation.correctedCount;
    warnings.push(`Corrected shares count from ${post.sharesCount} to ${sharesValidation.correctedCount}`);
  }
  if (post.shareCount !== sharesValidation.correctedCount) {
    correctedData.shareCount = sharesValidation.correctedCount;
    warnings.push(`Corrected share count from ${post.shareCount} to ${sharesValidation.correctedCount}`);
  }

  // Validate share metadata
  if (post.shareMetadata) {
    if (typeof post.shareMetadata !== 'object' || post.shareMetadata === null) {
      errors.push('Share metadata must be an object');
    } else {
      const { shareBreakdown } = post.shareMetadata;
      if (shareBreakdown && typeof shareBreakdown === 'object') {
        const breakdownTotal = (shareBreakdown.friends || 0) + (shareBreakdown.feeds || 0) + (shareBreakdown.groups || 0);
        if (breakdownTotal !== sharesValidation.correctedCount) {
          warnings.push(`Share breakdown total (${breakdownTotal}) doesn't match shares count (${sharesValidation.correctedCount})`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedData: Object.keys(correctedData).length > 0 ? correctedData : undefined
  };
}

/**
 * Sanitize and normalize engagement data for backward compatibility
 */
export function sanitizeEngagementData(post: any): Post {
  const validation = validatePostEngagement(post);
  
  // Apply corrections if needed
  const sanitizedPost = {
    ...post,
    ...validation.correctedData,
    // Ensure arrays exist
    likes: Array.isArray(post.likes) ? post.likes : [],
    comments: Array.isArray(post.comments) ? post.comments : [],
    shares: Array.isArray(post.shares) ? post.shares : [],
    // Ensure share metadata exists
    shareMetadata: post.shareMetadata || {
      lastSharedAt: null,
      shareBreakdown: {
        friends: 0,
        feeds: 0,
        groups: 0
      }
    }
  };

  // Log warnings in development
  if (validation.warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`Post ${post.id} engagement data warnings:`, validation.warnings);
  }

  // Log errors in development
  if (validation.errors.length > 0 && process.env.NODE_ENV === 'development') {
    console.error(`Post ${post.id} engagement data errors:`, validation.errors);
  }

  return sanitizedPost as Post;
}

/**
 * Check if user has liked a post (handles both legacy and new formats)
 */
export function hasUserLikedPost(likes: any[], userId: string): boolean {
  if (!Array.isArray(likes) || !userId) {
    return false;
  }

  return likes.some((like: any) => {
    if (typeof like === 'string') {
      return like === userId;
    } else if (typeof like === 'object' && like !== null) {
      return like.userId === userId;
    }
    return false;
  });
}

/**
 * Check if user has shared a post
 */
export function hasUserSharedPost(shares: any[], userId: string): boolean {
  if (!Array.isArray(shares) || !userId) {
    return false;
  }

  return shares.includes(userId);
}

/**
 * Calculate engagement score for trending algorithm
 */
export function calculateEngagementScore(post: Post, timeWeight: number = 1): number {
  const likesWeight = 1;
  const commentsWeight = 2;
  const sharesWeight = 3;

  const baseScore = (post.likesCount * likesWeight) + 
                   (post.commentsCount * commentsWeight) + 
                   (post.sharesCount * sharesWeight);

  return baseScore * timeWeight;
}