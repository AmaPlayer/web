/**
 * Authentication Context Type Definitions
 * 
 * Defines types for the AuthContext which manages user authentication state
 * and provides authentication-related methods throughout the application.
 */

import { User, UserCredential } from 'firebase/auth';
import { ReactNode } from 'react';

/**
 * Result type for password change operations
 */
export interface PasswordChangeResult {
  success: boolean;
  error?: string;
  requiresReauth?: boolean;
  suggestedAction?: string;
}

/**
 * Profile data that can be updated for a user
 */
export interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
}

/**
 * The value provided by the AuthContext
 */
export interface AuthContextValue {
  /** The currently authenticated user, or null if not authenticated */
  currentUser: User | null;
  
  /** Check if the current user is a guest (anonymous) */
  isGuest: () => boolean;
  
  /** Sign up a new user with email and password */
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  
  /** Log in an existing user with email and password */
  login: (email: string, password: string, keepLoggedIn?: boolean) => Promise<UserCredential>;
  
  /** Log in as a guest (anonymous user) */
  guestLogin: () => Promise<UserCredential>;
  
  /** Log in with Google OAuth */
  googleLogin: () => Promise<UserCredential | void>;
  
  /** Log in with Apple OAuth */
  appleLogin: () => Promise<UserCredential>;
  
  /** Log out the current user */
  logout: () => Promise<void>;
  
  /** Update the current user's profile */
  updateUserProfile: (profileData: ProfileUpdateData) => Promise<User>;
  
  /** Manually refresh the auth context state */
  refreshAuth: () => void;
  
  /** Change the current user's password */
  changePassword: (currentPassword: string, newPassword: string, isSocialUser?: boolean) => Promise<PasswordChangeResult>;

  /** Send password reset email to the user */
  resetPassword: (email: string) => Promise<void>;

  /** Get user-friendly error message for authentication errors */
  getAuthErrorMessage: (error: unknown) => string;
  
  /** Validate current authentication state */
  validateAuthState: () => Promise<boolean>;
  
  /** Refresh authentication token */
  refreshAuthToken: () => Promise<void>;
}

/**
 * Props for the AuthProvider component
 */
export interface AuthProviderProps {
  /** Child components that will have access to the auth context */
  children: ReactNode;
}
