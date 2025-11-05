import { createContext, useContext, useState, useEffect, ReactElement } from 'react';
import { auth } from '../lib/firebase';
import notificationService from '../services/notificationService';
import errorHandler from '../utils/error/errorHandler';
import authErrorHandler from '../utils/error/authErrorHandler';
import { runFirebaseDiagnostics } from '../utils/diagnostics/firebaseDiagnostic';
import { firebaseSyncManager } from '../services/preferencesService';
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
  User,
  UserCredential
} from 'firebase/auth';
import { 
  AuthContextValue, 
  AuthProviderProps, 
  PasswordChangeResult,
  ProfileUpdateData 
} from '../types/contexts/auth';
import { LanguageCode, ThemeMode } from '../types/contexts/preferences';

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
    console.log('🔄 Starting Google login...');
    
    // Test basic Firebase auth functionality first
    try {
      await signInAnonymously(auth);
      await signOut(auth);
      console.log('✅ Firebase Auth is working');
    } catch (testError: any) {
      console.error('❌ Firebase Auth test failed:', testError);
      throw new Error('Firebase Auth is not properly configured');
    }
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Set custom parameters for better compatibility
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      console.log('🔧 Firebase Config Check:', {
        apiKey: auth.app.options.apiKey ? 'Present' : 'Missing',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        currentURL: window.location.origin
      });
      
      console.log('🔄 Attempting popup login...');
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google login successful:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      return result;
    } catch (error: any) {
      console.error('❌ Google login error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        console.log('🔄 Popup blocked by browser, trying redirect...');
        await signInWithRedirect(auth, provider);
        return Promise.resolve() as any;
      }
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login was cancelled. Please try again.');
      }
      
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google login. Please contact support.');
      }
      
      if (error.message?.includes('Cross-Origin-Opener-Policy')) {
        console.log('🔄 COOP issue detected, trying redirect...');
        await signInWithRedirect(auth, provider);
        return Promise.resolve() as any;
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async function appleLogin(): Promise<UserCredential | void> {
    const provider = new OAuthProvider('apple.com');
    // Request additional scopes if needed
    provider.addScope('email');
    provider.addScope('name');
    
    try {
      // Try popup first
      console.log('🔄 Starting Apple login with popup method...');
      return await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const errorCode = (error as { code?: string }).code;
      const errorMessage = (error as { message?: string }).message;
      
      console.error('❌ Apple login popup error:', { errorCode, errorMessage });
      
      // Handle COOP and popup-related errors by falling back to redirect
      if (errorCode === 'auth/popup-blocked' || 
          errorCode === 'auth/popup-closed-by-user' ||
          errorCode === 'auth/cancelled-popup-request' ||
          errorMessage?.includes('Cross-Origin-Opener-Policy') ||
          errorMessage?.includes('popup') ||
          errorMessage?.includes('window.closed')) {
        
        console.log('🔄 Popup blocked or COOP issue, falling back to redirect...');
        
        try {
          return await signInWithRedirect(auth, provider);
        } catch (redirectError: unknown) {
          const redirectErr = redirectError instanceof Error ? redirectError : new Error(String(redirectError));
          console.error('❌ Redirect fallback also failed:', redirectErr);
          
          errorHandler.logError(redirectErr, 'Auth-AppleLogin-RedirectFallback', 'error', {
            originalError: errorCode,
            fallbackError: (redirectError as { code?: string }).code
          });
          
          throw redirectError;
        }
      }
      
      // For other errors, log and re-throw
      errorHandler.handleAuthError(err, { 
        method: 'apple_login_popup',
        errorCode: errorCode 
      });
      
      throw error;
    }
  }

  function logout(): Promise<void> {
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
    // Handle redirect result from Google OAuth
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          errorHandler.logError(new Error('Google redirect login successful'), 'Auth-GoogleRedirect', 'warning', {
            userId: result.user.uid,
            method: 'redirect_success'
          });
          setCurrentUser(result.user);
        }
      })
      .catch((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        errorHandler.handleAuthError(err, { 
          method: 'google_redirect_result',
          errorCode: (error as { code?: string }).code 
        });
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Only initialize notifications if permission is already granted and user is on authenticated pages
      if (user && !user.isAnonymous && Notification.permission === 'granted') {
        // Check if we're on an authenticated page (not landing/login/signup)
        const currentPath = window.location.pathname;
        const isAuthenticatedPage = !['/','', '/landing', '/login', '/signup'].includes(currentPath);
        
        if (isAuthenticatedPage) {
          try {
            await notificationService.initialize();
            await notificationService.getAndSaveToken(user.uid);
            
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

  // Debug function to test Google Auth setup
  async function testGoogleAuthSetup(): Promise<void> {
    console.log('🧪 Testing Google Auth Setup...');
    
    // Check if we're in development
    const isDev = process.env.NODE_ENV === 'development';
    console.log('Environment:', isDev ? 'Development' : 'Production');
    
    // Check current domain
    console.log('Current domain:', window.location.hostname);
    console.log('Current origin:', window.location.origin);
    
    // Check Firebase config
    console.log('Firebase Auth Domain:', auth.app.options.authDomain);
    
    // Test Firebase connectivity
    try {
      console.log('🔄 Testing Firebase connectivity...');
      const testUser = await signInAnonymously(auth);
      console.log('✅ Firebase Auth is working, test user:', testUser.user.uid);
      await signOut(auth);
      console.log('✅ Firebase signout successful');
    } catch (e) {
      console.error('❌ Firebase connectivity test failed:', e);
    }
    
    // Test popup capability
    try {
      const testPopup = window.open('about:blank', '_blank', 'width=500,height=600');
      if (testPopup) {
        console.log('✅ Browser allows popups');
        testPopup.close();
      } else {
        console.warn('⚠️ Browser blocks popups');
      }
    } catch (e) {
      console.error('❌ Popup test failed:', e);
    }
    
    // Test Google provider creation
    try {
      const provider = new GoogleAuthProvider();
      console.log('✅ GoogleAuthProvider created successfully');
      
      // Test if we can get the auth URL (without actually signing in)
      console.log('✅ Provider configured with scopes and custom parameters');
    } catch (e) {
      console.error('❌ GoogleAuthProvider creation failed:', e);
    }
    
    // Test Firestore permissions (this was causing the error)
    try {
      console.log('🔄 Testing Firestore permissions...');
      if (currentUser) {
        const testPrefs = {
          language: 'en' as LanguageCode,
          theme: 'dark' as ThemeMode,
          lastUpdated: Date.now()
        };
        
        // This should now work with the updated rules
        await firebaseSyncManager.syncToFirebase(currentUser.uid, testPrefs);
        console.log('✅ Firestore preferences sync working');
      } else {
        console.log('ℹ️ No current user, skipping Firestore test');
      }
    } catch (e) {
      console.error('❌ Firestore permissions test failed:', e);
    }
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

  const value: AuthContextValue = {
    currentUser,
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
    getAuthErrorMessage,
    validateAuthState,
    refreshAuthToken,
    testGoogleAuthSetup
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
