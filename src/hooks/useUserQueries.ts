// React Query hooks for user-related data with offline-first caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types/models';

// Mock implementations
const userService = {
  getUserProfile: async (userId: string) => ({} as User),
  searchUsers: async (searchTerm: string, limit?: number) => [] as User[],
  getUserFollowers: async (userId: string, limit?: number) => [] as User[],
  getUserFollowing: async (userId: string, limit?: number) => [] as User[],
  getUserActivitySummary: async (userId: string) => ({}),
  updateUserProfile: async (userId: string, updateData: Partial<User>) => ({} as User),
  toggleFollow: async (currentUserId: string, targetUserId: string) => ({ success: true }),
  updateUserStats: async (userId: string, statsUpdate: any) => ({})
};

const queryKeys = {
  userProfile: (userId: string) => ['user', 'profile', userId],
  searchUsers: (searchTerm: string) => ['users', 'search', searchTerm],
  userFollowers: (userId: string) => ['user', 'followers', userId],
  userFollowing: (userId: string) => ['user', 'following', userId]
};

const QUERY_CONFIGS = {
  USER_PROFILE: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  }
};

const getUserCacheManager = (userId: string) => null;

interface UserQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

interface UsersQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

interface UpdateUserProfileMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface FollowUserMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

// Hook for getting user profile with caching
export const useUserProfile = (userId: string, options: UserQueryOptions = {}) => {
  return useQuery<User>({
    queryKey: queryKeys.userProfile(userId),
    queryFn: async () => {
      // Try to get from user-specific cache first
      const cacheManager = getUserCacheManager(userId);
      if (cacheManager) {
        const cached = await cacheManager.getCachedUserData('USER_PROFILE');
        if (cached) {
          console.log('📋 User profile loaded from cache:', userId);
          return cached as User;
        }
      }

      // Fetch from API
      const profile = await userService.getUserProfile(userId);
      
      // Cache the result
      if (cacheManager && profile) {
        await cacheManager.cacheUserData('USER_PROFILE', profile);
      }
      
      return profile;
    },
    enabled: !!userId,
    ...QUERY_CONFIGS.USER_PROFILE,
    ...options,
  });
};

// Hook for searching users with caching
export const useSearchUsers = (searchTerm: string, options: UsersQueryOptions & { limit?: number } = {}) => {
  return useQuery<User[]>({
    queryKey: queryKeys.searchUsers(searchTerm),
    queryFn: () => userService.searchUsers(searchTerm, options.limit || 20),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    cacheTime: 5 * 60 * 1000, // 5 minutes cache retention
    ...options,
  });
};

// Hook for getting user followers with caching
export const useUserFollowers = (userId: string, options: UsersQueryOptions & { limit?: number } = {}) => {
  return useQuery<User[]>({
    queryKey: queryKeys.userFollowers(userId),
    queryFn: async () => {
      const cacheManager = getUserCacheManager(userId);
      if (cacheManager) {
        const cached = await cacheManager.getCachedUserData('FOLLOWED_CONTENT', 'followers');
        if (cached) {
          return cached as User[];
        }
      }

      const followers = await userService.getUserFollowers(userId, options.limit || 50);
      
      if (cacheManager && followers) {
        await cacheManager.cacheUserData('FOLLOWED_CONTENT', followers, 'followers');
      }
      
      return followers;
    },
    enabled: !!userId,
    ...QUERY_CONFIGS.USER_PROFILE,
    ...options,
  });
};

// Hook for getting user following with caching
export const useUserFollowing = (userId: string, options: UsersQueryOptions & { limit?: number } = {}) => {
  return useQuery<User[]>({
    queryKey: queryKeys.userFollowing(userId),
    queryFn: async () => {
      const cacheManager = getUserCacheManager(userId);
      if (cacheManager) {
        const cached = await cacheManager.getCachedUserData('FOLLOWED_CONTENT', 'following');
        if (cached) {
          return cached as User[];
        }
      }

      const following = await userService.getUserFollowing(userId, options.limit || 50);
      
      if (cacheManager && following) {
        await cacheManager.cacheUserData('FOLLOWED_CONTENT', following, 'following');
      }
      
      return following;
    },
    enabled: !!userId,
    ...QUERY_CONFIGS.USER_PROFILE,
    ...options,
  });
};

// Hook for getting user activity summary
export const useUserActivity = (userId: string, options: UserQueryOptions = {}) => {
  return useQuery<any>({
    queryKey: ['user', 'activity', userId],
    queryFn: () => userService.getUserActivitySummary(userId),
    enabled: !!userId,
    ...QUERY_CONFIGS.USER_PROFILE,
    ...options,
  });
};

// Mutation for updating user profile
export const useUpdateUserProfile = (userId: string, options: UpdateUserProfileMutationOptions = {}) => {
  const queryClient = useQueryClient();
  const cacheManager = getUserCacheManager(userId);

  return useMutation({
    mutationFn: (updateData: Partial<User>) => userService.updateUserProfile(userId, updateData),
    onMutate: async (updateData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.userProfile(userId) });
      
      const previousProfile = queryClient.getQueryData<User>(queryKeys.userProfile(userId));
      
      // Optimistically update the cache
      queryClient.setQueryData<User>(queryKeys.userProfile(userId), (old) => ({
        ...old!,
        ...updateData,
        updatedAt: new Date(),
      }));

      return { previousProfile };
    },
    onError: (err, updateData, context) => {
      // Revert on error
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.userProfile(userId), context.previousProfile);
      }
    },
    onSettled: async (data) => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
      
      // Update user-specific cache
      if (cacheManager && data) {
        await cacheManager.cacheUserData('USER_PROFILE', data);
      }
    },
    ...options,
  });
};

// Mutation for follow/unfollow
export const useToggleFollow = (currentUserId: string, options: FollowUserMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId: targetUserId }: { userId: string }) => 
      userService.toggleFollow(currentUserId, targetUserId),
    onMutate: async ({ userId: targetUserId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.userProfile(targetUserId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.userProfile(currentUserId) });

      const previousTarget = queryClient.getQueryData<User>(queryKeys.userProfile(targetUserId));
      const previousCurrent = queryClient.getQueryData<User>(queryKeys.userProfile(currentUserId));

      // Optimistic updates
      if (previousTarget) {
        const currentFollowing = previousCurrent?.following || [];
        const isFollowing = currentFollowing.includes(targetUserId);
        
        queryClient.setQueryData<User>(queryKeys.userProfile(targetUserId), {
          ...previousTarget,
          followersCount: isFollowing 
            ? Math.max(0, (previousTarget.followersCount || 0) - 1)
            : (previousTarget.followersCount || 0) + 1,
        });
      }

      if (previousCurrent) {
        const currentFollowing = previousCurrent?.following || [];
        const isFollowing = currentFollowing.includes(targetUserId);
        
        queryClient.setQueryData<User>(queryKeys.userProfile(currentUserId), {
          ...previousCurrent,
          followingCount: isFollowing 
            ? Math.max(0, (previousCurrent.followingCount || 0) - 1)
            : (previousCurrent.followingCount || 0) + 1,
          following: isFollowing
            ? currentFollowing.filter(id => id !== targetUserId)
            : [...currentFollowing, targetUserId],
        });
      }

      return { previousTarget, previousCurrent };
    },
    onError: (err, { userId: targetUserId }, context) => {
      // Revert optimistic updates on error
      if (context?.previousTarget) {
        queryClient.setQueryData(queryKeys.userProfile(targetUserId), context.previousTarget);
      }
      if (context?.previousCurrent) {
        queryClient.setQueryData(queryKeys.userProfile(currentUserId), context.previousCurrent);
      }
    },
    onSettled: (data, error, { userId: targetUserId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(targetUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(currentUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollowers(targetUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollowing(currentUserId) });
    },
    ...options,
  });
};

// Mutation for updating user stats
export const useUpdateUserStats = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statsUpdate: any) => userService.updateUserStats(userId, statsUpdate),
    onSuccess: (data) => {
      // Update the user profile query with new stats
      queryClient.setQueryData<User>(queryKeys.userProfile(userId), (old) => ({
        ...old!,
        ...data,
        updatedAt: new Date(),
      }));
      
      // Invalidate activity summary
      queryClient.invalidateQueries({ queryKey: ['user', 'activity', userId] });
    },
  });
};

// Hook for prefetching user data
export const usePrefetchUserData = () => {
  const queryClient = useQueryClient();

  const prefetchUserProfile = async (userId: string): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.userProfile(userId),
      queryFn: () => userService.getUserProfile(userId),
      ...QUERY_CONFIGS.USER_PROFILE,
    });
  };

  const prefetchUserFollowers = async (userId: string): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.userFollowers(userId),
      queryFn: () => userService.getUserFollowers(userId),
      ...QUERY_CONFIGS.USER_PROFILE,
    });
  };

  const prefetchUserActivity = async (userId: string): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: ['user', 'activity', userId],
      queryFn: () => userService.getUserActivitySummary(userId),
      ...QUERY_CONFIGS.USER_PROFILE,
    });
  };

  return {
    prefetchUserProfile,
    prefetchUserFollowers,
    prefetchUserActivity,
  };
};

// Hook for managing user cache
export const useUserCache = (userId: string) => {
  const cacheManager = getUserCacheManager(userId);

  const clearUserCache = async (): Promise<boolean> => {
    if (cacheManager) {
      return await cacheManager.clearAllUserCaches();
    }
    return false;
  };

  const getCacheStats = async (): Promise<any> => {
    if (cacheManager) {
      return await cacheManager.getCacheStats();
    }
    return {};
  };

  const prefetchContent = async (contentTypes: string[] = ['PROFILE', 'POSTS']): Promise<void> => {
    if (cacheManager) {
      return await cacheManager.prefetchUserContent(contentTypes);
    }
  };

  return {
    clearUserCache,
    getCacheStats,
    prefetchContent,
    cacheManager,
  };
};
