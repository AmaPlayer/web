import { createContext, useContext, useState, useEffect, ReactElement } from 'react';
import { auth } from '../lib/firebase';
import notificationService from '../services/notificationService';
import errorHandler from '../utils/errorHandler';
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

  function signup(email: string, password: string, displayName: string): Promise<void> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        return updateProfile(userCredential.user, { displayName });
      });
  }

  function login(email: string, password: string): Promise<UserCredential> {
    return setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      });
  }

  function guestLogin(): Promise<UserCredential> {
    return signInAnonymously(auth);
  }

  async function googleLogin(): Promise<UserCredential | void> {
    const provider = new GoogleAuthProvider();
    
    try {
      // First try popup method
      return await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      errorHandler.handleAuthError(err, { 
        method: 'google_login_popup',
        errorCode: (error as { code?: string }).code 
      });
      
      // If popup fails due to CORS, popup blocked, or other popup issues, fallback to redirect
      const errorCode = (error as { code?: string }).code;
      const errorMessage = (error as { message?: string }).message;
      
      if (errorCode === 'auth/popup-blocked' || 
          errorCode === 'auth/popup-closed-by-user' ||
          errorCode === 'auth/cancelled-popup-request' ||
          errorMessage?.includes('Cross-Origin-Opener-Policy') ||
          errorMessage?.includes('popup')) {
        
        errorHandler.logError(err, 'Auth-GoogleLogin-Fallback', 'warning', {
          fallbackMethod: 'redirect',
          originalError: errorCode
        });
        
        return signInWithRedirect(auth, provider);
      }
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
            
            errorHandler.logError(new Error('Notifications initialized successfully'), 'Auth-Notifications', 'warning', {
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

  async function changePassword(currentPassword: string, newPassword: string): Promise<PasswordChangeResult> {
    const PASSWORD_ERRORS: Record<string, string> = {
      'auth/wrong-password': 'Current password is incorrect',
      'auth/weak-password': 'New password must be at least 6 characters',
      'auth/requires-recent-login': 'Please log out and log back in to change your password',
      'auth/user-mismatch': 'Authentication error. Please try again',
      'auth/user-not-found': 'User not found',
      'auth/invalid-credential': 'Invalid credentials provided',
      'default': 'Failed to change password. Please try again'
    };

    try {
      if (!currentUser || !currentUser.email) {
        return {
          success: false,
          error: 'No authenticated user found'
        };
      }

      // Step 1: Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Step 2: Update password
      await updatePassword(currentUser, newPassword);

      return { success: true };
    } catch (error: unknown) {
      const errorCode = (error as { code?: string }).code;
      return {
        success: false,
        error: PASSWORD_ERRORS[errorCode || 'default'] || PASSWORD_ERRORS.default
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
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
