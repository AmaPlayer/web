import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import LoadingSpinner from '../../components/common/ui/LoadingSpinner';
import ToastContainer from '../../components/common/ui/ToastContainer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { validateEmail } from '../../utils/validation/validation';
import authErrorHandler from '../../utils/error/authErrorHandler';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [canRetry, setCanRetry] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const { login, guestLogin, googleLogin, appleLogin, resetPassword, getAuthErrorMessage } = useAuth();
  const { t } = useLanguage();
  const { toasts, showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();

  // Store the selected role when component mounts
  useEffect(() => {
    if (role) {
      localStorage.setItem('selectedUserRole', role);
    }
  }, [role]);

  // Clear field-specific errors when user starts typing
  const handleEmailChange = (value: string): void => {
    setEmail(value);
    if (emailError) setEmailError('');
    if (error) setError('');
  };

  const handlePasswordChange = (value: string): void => {
    setPassword(value);
    if (passwordError) setPasswordError('');
    if (error) setError('');
  };

  // Validate form fields
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Invalid email');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSuccessfulLogin = async (user: any): Promise<void> => {
    showSuccess('Login Successful', 'Welcome back! Redirecting to your dashboard...');

    try {
      const userService = (await import('../../services/api/userService')).default;

      // Check for pending athlete profile (sport/position/specializations)
      const pendingAthleteProfile = localStorage.getItem('pendingAthleteProfile');
      if (pendingAthleteProfile && user) {
        try {
          const athleteData = JSON.parse(pendingAthleteProfile);

          // Save athlete profile to Firestore
          await userService.updateUserProfile(user.uid, {
            sports: athleteData.sports || [],
            position: athleteData.position || null,
            specializations: athleteData.specializations || {}
          });

          // Clear the pending athlete profile data
          localStorage.removeItem('pendingAthleteProfile');
          console.log('✅ Athlete profile saved after login');
        } catch (error) {
          console.error('Error saving pending athlete profile:', error);
        }
      }

      // Check for pending personal details
      const pendingDetails = localStorage.getItem('pendingPersonalDetails');
      if (pendingDetails && user) {
        try {
          const details = JSON.parse(pendingDetails);

          // Save personal details to Firestore
          await userService.updateUserProfile(user.uid, {
            displayName: details.fullName,
            bio: details.bio || undefined,
            dateOfBirth: details.dateOfBirth,
            gender: details.gender,
            height: details.height || undefined,
            weight: details.weight || undefined,
            country: details.country,
            state: details.state,
            city: details.city,
            mobile: details.phone || undefined,
            location: `${details.city}, ${details.state}, ${details.country}`
          });

          // Clear the pending data
          localStorage.removeItem('pendingPersonalDetails');
          console.log('✅ Personal details saved after login');
        } catch (error) {
          console.error('Error saving pending personal details:', error);
        }
      }
    } catch (error) {
      console.error('Error importing userService:', error);
    }

    // Navigate to home after successful login
    setTimeout(() => navigate('/home'), 1000);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setEmailError('');
      setPasswordError('');
      setLoading(true);
      setCanRetry(false);

      const userCredential = await login(email, password, keepLoggedIn);
      handleSuccessfulLogin(userCredential.user);
    } catch (error) {
      // Use the enhanced error handling
      const errorInfo = authErrorHandler.formatErrorForDisplay(error);
      const errorMessage = errorInfo.message + (errorInfo.action ? ` ${errorInfo.action}` : '');
      
      setError(errorMessage);
      setCanRetry(errorInfo.canRetry);

      // Show toast notification for better UX
      if (errorInfo.canRetry) {
        showWarning('Login Failed', errorMessage);
      } else {
        showError('Login Failed', errorMessage);
      }

      // Handle specific validation errors
      if (authErrorHandler.isValidationError(error)) {
        const errorResult = authErrorHandler.getAuthErrorMessage(error);
        if (errorResult.originalCode === 'auth/invalid-email') {
          setEmailError(errorResult.message);
          setError('');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin(): Promise<void> {
    try {
      setError('');
      setEmailError('');
      setPasswordError('');
      setLoading(true);
      setCanRetry(false);
      
      const userCredential = await guestLogin();
      handleSuccessfulLogin(userCredential.user);
    } catch (error) {
      const errorInfo = authErrorHandler.formatErrorForDisplay(error);
      const errorMessage = errorInfo.message + (errorInfo.action ? ` ${errorInfo.action}` : '');
      
      setError(errorMessage);
      setCanRetry(errorInfo.canRetry);
      showError('Guest Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(): Promise<void> {
    try {
      setError('');
      setEmailError('');
      setPasswordError('');
      setLoading(true);
      setCanRetry(false);
      
      const result = await googleLogin();
      if (result && result.user) {
        handleSuccessfulLogin(result.user);
      }
    } catch (error) {
      const errorInfo = authErrorHandler.formatErrorForDisplay(error);
      const errorMessage = errorInfo.message + (errorInfo.action ? ` ${errorInfo.action}` : '');
      
      setError(errorMessage);
      setCanRetry(errorInfo.canRetry);
      showError('Google Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin(): Promise<void> {
    try {
      setError('');
      setEmailError('');
      setPasswordError('');
      setLoading(true);
      setCanRetry(false);
      
      const userCredential = await appleLogin();
      handleSuccessfulLogin(userCredential.user);
    } catch (error) {
      const errorInfo = authErrorHandler.formatErrorForDisplay(error);
      const errorMessage = errorInfo.message + (errorInfo.action ? ` ${errorInfo.action}` : '');
      
      setError(errorMessage);
      setCanRetry(errorInfo.canRetry);
      showError('Apple Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = async (): Promise<void> => {
    setResetError('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    const emailValidation = validateEmail(resetEmail);
    if (!emailValidation.isValid) {
      setResetError(emailValidation.error || 'Invalid email address');
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetEmailSent(true);
      showSuccess('Password Reset Email Sent', 'Check your inbox for password reset instructions');
    } catch (error) {
      const errorInfo = authErrorHandler.formatErrorForDisplay(error);
      setResetError(errorInfo.message);
      showError('Password Reset Failed', errorInfo.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgotPassword = (): void => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetEmailSent(false);
    setResetError('');
  };

  const handleGoBack = (): void => {
    if (role) {
      navigate(`/about/${role}`);
    } else {
      navigate('/');
    }
  };

  const handleHomeClick = (): void => {
    // Force full page reload to ensure WelcomePage renders correctly
    window.location.href = '/';
  };

  return (
    <>
      <ToastContainer toasts={toasts} position="top-right" />
      <div className="auth-container auth-page">
        <button className="home-btn" onClick={handleHomeClick} title="Go to Welcome Page">
          <Home size={20} />
        </button>
      <div className="auth-controls-only">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <h1>{t('amaplayer')}</h1>
        {role && (
          <div className="role-indicator">
            <p>Login as <strong>{role}</strong></p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className={`error ${canRetry ? 'error-retryable' : ''}`}>
              {error}
              {canRetry && (
                <button 
                  type="button" 
                  className="retry-btn"
                  onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)}
                  disabled={loading}
                >
                  Retry
                </button>
              )}
            </div>
          )}
          <div className="form-group">
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={emailError ? 'input-error' : ''}
              required
              disabled={loading}
              autoComplete="email"
            />
            {emailError && <div className="field-error">{emailError}</div>}
          </div>
          <div className="form-group password-group">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t('password')}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={passwordError ? 'input-error' : ''}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && <div className="field-error">{passwordError}</div>}
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Keep me logged in</span>
            </label>
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>
          <button disabled={loading} type="submit" className="auth-btn">
            {loading ? (
              <>
                <LoadingSpinner size="small" color="white" className="in-button" />
                Signing in...
              </>
            ) : (
              t('login')
            )}
          </button>
        </form>
        <div className="social-login">
          <button
            disabled={loading}
            className="auth-btn google-btn"
            onClick={handleGoogleLogin}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" color="white" className="in-button" />
                Connecting...
              </>
            ) : (
              'Join AmaPlayer with Google'
            )}
          </button>
          <button
            disabled={loading}
            className="auth-btn apple-btn"
            onClick={handleAppleLogin}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" color="white" className="in-button" />
                Connecting...
              </>
            ) : (
              'Sign in with Apple'
            )}
          </button>
        </div>
        <div className="guest-login">
          <button
            disabled={loading}
            onClick={handleGuestLogin}
            className="auth-btn guest-btn"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" color="inherit" className="in-button" />
                Connecting...
              </>
            ) : (
              t('continueAsGuest')
            )}
          </button>
        </div>
        <div className="auth-link-section">
          <p>{t('dontHaveAccount')}</p>
          <button
            className="auth-link-btn"
            onClick={() => navigate('/signup')}
          >
            {t('signup')}
          </button>
        </div>
      </div>
    </div>

    {/* Forgot Password Modal */}
    {showForgotPassword && (
      <div className="modal-overlay" onClick={handleCloseForgotPassword}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Reset Password</h2>
            <button
              className="modal-close-btn"
              onClick={handleCloseForgotPassword}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            {resetEmailSent ? (
              <div className="reset-success">
                <div className="success-icon">✓</div>
                <h3>Check Your Email</h3>
                <p>
                  We've sent password reset instructions to <strong>{resetEmail}</strong>.
                  Please check your inbox and follow the link to reset your password.
                </p>
                <button
                  className="btn-primary"
                  onClick={handleCloseForgotPassword}
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <p className="reset-instructions">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
                {resetError && <div className="error">{resetError}</div>}
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetError('');
                    }}
                    disabled={resetLoading}
                    autoComplete="email"
                    className={resetError ? 'input-error' : ''}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleCloseForgotPassword}
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <LoadingSpinner size="small" color="white" className="in-button" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

