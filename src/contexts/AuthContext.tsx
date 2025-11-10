import { createContext, useContext, useState, useEffect, useRef, ReactElement } from 'react';
import { auth } from '../lib/firebase';
import notificationService from '../services/notificationService';
import errorHandler from '../utils/error/errorHandler';
import authErrorHandler from '../utils/error/authErrorHandler';
import { runFirebaseDiagnostics } from '../utils/diagnostics/firebaseDiagnostic';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  User,
  UserCredential,
  AuthCredential
} from 'firebase/auth';
import { 
  AuthContextValue, 
  AuthProviderProps, 
  PasswordChangeResult,
  ProfileUpdateData 
} from '../types/contexts/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const redirectCheckRef = useRef(false);

  // Test Firebase connection
  async function testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Firebase connection...');
      
      // Test anonymous sign-in to verify Firebase is working
      const result = await signInAnonymously(auth);
      console.log('✅ Firebase connection test successful');
      
      // Sign out the anonymous user immediately
      await signOut(auth);
      console.log('✅ Anonymous user signed out');
      
      return true;
    } catch (error: any) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }

  async function signup(email: string, password: string, displayName: string): Promise<void> {
    try {
      console.log('🔥 Firebase Auth Config Check:', {
        apiKey: auth.app.options.apiKey ? 'Present' : 'Missing',
        authDomain: auth.app.options.authDomain ? 'Present' : 'Missing',
        projectId: auth.app.options.projectId ? 'Present' : 'Missing'
      });
      
      // Test Firebase connection first
      console.log('🧪 Testing Firebase connection before signup...');
      const connectionTest = await testFirebaseConnection();
      if (!connectionTest) {
        // Run full diagnostics if connection test fails
        console.log('🔍 Running full Firebase diagnostics...');
        await runFirebaseDiagnostics();
        throw new Error('Unable to connect to Firebase. Please check your internet connection and try again.');
      }
      
      console.log('📝 Attempting to create user with email:', email);
      console.log('📝 Display name:', displayName);
      console.log('📝 Password length:', password.length);
      
      // Validate inputs before sending to Firebase
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (!displayName || displayName.trim().length < 2) {
        throw new Error('Display name must be at least 2 characters long');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User created successfully, updating profile...');
      
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
      console.log('✅ Profile updated successfully');
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      
      // Log specific error details for debugging
      if (error.code) {
        console.error('🔥 Firebase error code:', error.code);
        console.error('🔥 Firebase error message:', error.message);
        
        // Log additional error details
        if (error.customData) {
          console.error('🔥 Firebase custom data:', error.customData);
        }
        
        // Handle specific Firebase error codes
        if (error.code === 'auth/operation-not-allowed') {
          throw new Error('Email/password sign-up is not enabled. Please contact support.');
        }
        
        if (error.code === 'auth/weak-password') {
          throw new Error('Password is too weak. Please use at least 6 characters.');
        }
        
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('An account with this email already exists. Try logging in instead.');
        }
        
        if (error.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        }
      }
      
      // Use the auth error handler to format the error
      const formattedError = authErrorHandler.formatErrorForDisplay(error);
      console.error('📝 Formatted error:', formattedError);
      
      // Re-throw with more context
      throw new Error(formattedError.message || error.message || 'Failed to create account');
    }
  }

  async function login(email: string, password: string, keepLoggedIn: boolean = true): Promise<UserCredential> {
    try {
      // Set persistence based on user preference
      const persistence = keepLoggedIn ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      // Attempt to sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Log successful login for debugging
      authErrorHandler.logAuthError(
        new Error('Login successful'), 
        'AuthContext-Login', 
        { 
          userId: userCredential.user.uid,
          persistence: keepLoggedIn ? 'local' : 'session',
          method: 'email_password'
        }
      );
      
      return userCredential;
    } catch (error) {
      // Log the error with context
      authErrorHandler.logAuthError(error, 'AuthContext-Login', {
        email: email, // Don't log the actual email in production
        persistence: keepLoggedIn ? 'local' : 'session',
        method: 'email_password'
      });
      
      // Re-throw the error with enhanced error information
      throw error;
    }
  }

  function guestLogin(): Promise<UserCredential> {
    return signInAnonymously(auth);
  }

  async function googleLogin(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('🔵 Using POPUP method for Google Sign-In...');

    try {
      // Use popup method - simpler, no redirect issues
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google popup login successful!', result.user.email);
      return result;
    } catch (error: any) {
      console.error('❌ Error with Google popup:', error);

      // Check if the error is due to account already existing with different credential
      if (error.code === 'auth/account-exists-with-different-credential') {
        console.log('⚠️ Account exists with different credential - needs linking');
        // Attach the credential and email to the error so UI can handle it
        error.credential = GoogleAuthProvider.credentialFromError(error);
        error.email = error.customData?.email;
      }

      throw error;
    }
  }

  /**
   * Check what sign-in methods are available for an email
   */
  async function checkSignInMethods(email: string): Promise<string[]> {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods;
    } catch (error) {
      console.error('Error checking sign-in methods:', error);
      return [];
    }
  }

  /**
   * Link Google credential with existing email/password account
   * Used when user has email/password account and wants to add Google sign-in
   */
  async function linkGoogleAccount(credential: AuthCredential): Promise<UserCredential> {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      console.log('🔗 Linking Google credential to existing account...');
      const result = await linkWithCredential(currentUser, credential);
      console.log('✅ Google account linked successfully!');
      return result;
    } catch (error) {
      console.error('❌ Error linking Google account:', error);
      throw error;
    }
  }

  /**
   * Sign in with email/password and then link Google credential
   * Used when user tries Google login but already has email/password account
   */
  async function signInAndLinkGoogle(email: string, password: string, googleCredential: AuthCredential): Promise<UserCredential> {
    try {
      console.log('🔐 Signing in with email/password to link Google account...');

      // First, sign in with email/password
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email/password sign-in successful');

      // Then link the Google credential
      console.log('🔗 Now linking Google credential...');
      const result = await linkWithCredential(userCred.user, googleCredential);
      console.log('✅ Google account linked successfully!');

      return result;
    } catch (error) {
      console.error('❌ Error signing in and linking Google:', error);
      throw error;
    }
  }

  function appleLogin(): Promise<UserCredential> {
    const provider = new OAuthProvider('apple.com');
    // Request additional scopes if needed
    provider.addScope('email');
    provider.addScope('name');
    return signInWithPopup(auth, provider);
  }

  function logout(): Promise<void> {
    // Clear ALL redirect flags on logout
    localStorage.removeItem('googleRedirectPending');
    localStorage.removeItem('googleRedirectStartedAt');
    localStorage.removeItem('googleRedirectCheckDone');
    console.log('🚪 Logging out and clearing all redirect flags');
    return signOut(auth);
  }

  async function updateUserProfile(profileData: ProfileUpdateData): Promise<User> {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    await updateProfile(currentUser, profileData);
    // Force refresh the current user to get updated profile
    await currentUser.reload();
    setCurrentUser({ ...currentUser });
    console.log(' Auth context refreshed with new profile data');
    return currentUser;
  }

  function refreshAuth(): void {
    if (currentUser) {
      currentUser.reload().then(() => {
        setCurrentUser({ ...currentUser });
        console.log(' Auth context manually refreshed');
      });
    }
  }

  useEffect(() => {
    // Using popup method now, no need to check for redirect results
    console.log('🔵 Auth initialization (popup method - no redirect check needed)');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', {
        hasUser: !!user,
        email: user?.email,
        isAnonymous: user?.isAnonymous
      });
      setCurrentUser(user);
      setLoading(false);
      
      // Only initialize notifications if permission is already granted and user is on authenticated pages
      // Check if Notification API is supported (not available on iOS Safari/Chrome)
      if (user && !user.isAnonymous && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        // Check if we're on an authenticated page (not landing/login/signup)
        const currentPath = window.location.pathname;
        const isAuthenticatedPage = !['/','', '/landing', '/login', '/signup'].includes(currentPath);

        if (isAuthenticatedPage) {
          try {
            await notificationService.initialize(user.uid);

            console.log('✅ Notifications initialized successfully', {
              userId: user.uid,
              page: currentPath
            });
          } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            errorHandler.logError(err, 'Auth-NotificationInit', 'warning', {
              userId: user.uid,
              page: currentPath,
              errorCode: (error as { code?: string }).code
            });
          }
        }
      }
    });

    return unsubscribe;
  }, []);

  // Helper function to check if current user is a guest
  function isGuest(): boolean {
    return currentUser !== null && currentUser.isAnonymous;
  }

  // Get user-friendly error message for authentication errors
  function getAuthErrorMessage(error: unknown): string {
    const errorResult = authErrorHandler.getAuthErrorMessage(error);
    return errorResult.action ? `${errorResult.message} ${errorResult.action}` : errorResult.message;
  }

  // Validate authentication state
  async function validateAuthState(): Promise<boolean> {
    try {
      if (!currentUser) return false;
      
      // Force token refresh to validate current session
      await currentUser.getIdToken(true);
      return true;
    } catch (error) {
      authErrorHandler.logAuthError(error, 'AuthContext-ValidateState');
      return false;
    }
  }

  // Refresh authentication token
  async function refreshAuthToken(): Promise<void> {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      
      await currentUser.getIdToken(true);
      authErrorHandler.logAuthError(
        new Error('Token refresh successful'), 
        'AuthContext-RefreshToken', 
        { userId: currentUser.uid }
      );
    } catch (error) {
      authErrorHandler.logAuthError(error, 'AuthContext-RefreshToken');
      throw error;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string, isSocialUser: boolean = false): Promise<PasswordChangeResult> {
    try {
      if (!currentUser) {
        const error = new Error('No authenticated user found');
        authErrorHandler.logAuthError(error, 'AuthContext-ChangePassword');
        return {
          success: false,
          error: 'You must be logged in to change your password',
          suggestedAction: 'Please log in and try again'
        };
      }

      // Determine if user is actually a social user by checking provider data
      const isActuallySocialUser = isSocialUser || (
        currentUser.providerData.length > 0 && 
        currentUser.providerData.some(provider => 
          provider.providerId === 'google.com' || 
          provider.providerId === 'apple.com'
        )
      );

      // Validate new password before attempting change
      const { validatePassword } = await import('../utils/validation/validation');
      const passwordValidation = validatePassword(newPassword);
      
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error || 'Password does not meet requirements',
          suggestedAction: passwordValidation.suggestions?.[0]
        };
      }

      if (isActuallySocialUser) {
        // For social users setting their first password or users without email provider
        const hasEmailProvider = currentUser.providerData.some(provider => 
          provider.providerId === 'password'
        );

        if (!hasEmailProvider && !currentUser.email) {
          return {
            success: false,
            error: 'Cannot set password for this account type',
            suggestedAction: 'This account was created with a social login and cannot have a password'
          };
        }

        try {
          await updatePassword(currentUser, newPassword);
          
          authErrorHandler.logAuthError(
            new Error('Password set successfully for social user'), 
            'AuthContext-ChangePassword', 
            { 
              userId: currentUser.uid, 
              userType: 'social',
              hasEmailProvider: hasEmailProvider
            }
          );
          
          return { 
            success: true,
            suggestedAction: hasEmailProvider ? 
              'Password updated successfully' : 
              'Password set successfully. You can now use email/password to log in.'
          };
        } catch (error: unknown) {
          authErrorHandler.logAuthError(error, 'AuthContext-ChangePassword', {
            userId: currentUser.uid,
            userType: 'social',
            hasEmailProvider: hasEmailProvider
          });
          
          const errorResult = authErrorHandler.getAuthErrorMessage(error);
          
          if (authErrorHandler.requiresReauthentication(error)) {
            return {
              success: false,
              error: 'Recent authentication required for security',
              requiresReauth: true,
              suggestedAction: 'Please log out and log back in, then try setting your password again'
            };
          }
          
          // Handle specific social user password setting errors
          const errorCode = (error as { code?: string }).code;
          if (errorCode === 'auth/requires-recent-login') {
            return {
              success: false,
              error: 'For security, please log out and log back in first',
              requiresReauth: true,
              suggestedAction: 'Log out, log back in, then try setting your password'
            };
          }
          
          return {
            success: false,
            error: errorResult.message,
            suggestedAction: errorResult.action || 'Please try again or contact support'
          };
        }
      } else {
        // For email/password users changing their existing password
        if (!currentUser.email) {
          return {
            success: false,
            error: 'Email address is required to change password',
            suggestedAction: 'Please ensure your account has an email address'
          };
        }

        if (!currentPassword.trim()) {
          return {
            success: false,
            error: 'Current password is required',
            suggestedAction: 'Please enter your current password to verify your identity'
          };
        }

        try {
          // Step 1: Reauthenticate user with current password
          const credential = EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
          );
          await reauthenticateWithCredential(currentUser, credential);

          // Step 2: Update to new password
          await updatePassword(currentUser, newPassword);
          
          authErrorHandler.logAuthError(
            new Error('Password change successful for email user'), 
            'AuthContext-ChangePassword', 
            { userId: currentUser.uid, userType: 'email' }
          );
          
          return { 
            success: true,
            suggestedAction: 'Password updated successfully'
          };
        } catch (error: unknown) {
          authErrorHandler.logAuthError(error, 'AuthContext-ChangePassword', {
            userId: currentUser.uid,
            userType: 'email',
            step: 'reauthentication_or_update'
          });
          
          const errorResult = authErrorHandler.getAuthErrorMessage(error);
          const errorCode = (error as { code?: string }).code;
          
          // Handle specific reauthentication errors
          if (errorCode === 'auth/wrong-password') {
            return {
              success: false,
              error: 'Current password is incorrect',
              suggestedAction: 'Please check your current password and try again'
            };
          }
          
          if (errorCode === 'auth/too-many-requests') {
            return {
              success: false,
              error: 'Too many failed attempts',
              suggestedAction: 'Please wait a few minutes before trying again'
            };
          }
          
          if (authErrorHandler.requiresReauthentication(error)) {
            return {
              success: false,
              error: 'Authentication session expired',
              requiresReauth: true,
              suggestedAction: 'Please log out and log back in, then try changing your password'
            };
          }
          
          return {
            success: false,
            error: errorResult.message,
            suggestedAction: errorResult.action || 'Please try again or contact support if the problem persists'
          };
        }
      }
    } catch (error: unknown) {
      // Catch-all for unexpected errors
      authErrorHandler.logAuthError(error, 'AuthContext-ChangePassword', {
        userId: currentUser?.uid,
        userType: isSocialUser ? 'social' : 'email',
        step: 'unexpected_error'
      });
      
      return {
        success: false,
        error: 'An unexpected error occurred',
        suggestedAction: 'Please try again or contact support if the problem persists'
      };
    }
  }

  async function resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      authErrorHandler.logAuthError(
        new Error('Password reset email sent successfully'),
        'AuthContext-ResetPassword',
        { email }
      );
    } catch (error: unknown) {
      authErrorHandler.logAuthError(error, 'AuthContext-ResetPassword', { email });
      throw error;
    }
  }

  const value: AuthContextValue = {
    currentUser,
    loading,
    isGuest,
    signup,
    login,
    guestLogin,
    googleLogin,
    appleLogin,
    logout,
    updateUserProfile,
    refreshAuth,
    changePassword,
    resetPassword,
    getAuthErrorMessage,
    validateAuthState,
    refreshAuthToken,
    checkSignInMethods,
    linkGoogleAccount,
    signInAndLinkGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
