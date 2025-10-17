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
  const { login, guestLogin, googleLogin, appleLogin, getAuthErrorMessage } = useAuth();
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

  const handleSuccessfulLogin = (): void => {
    showSuccess('Login Successful', 'Welcome back! Redirecting to your dashboard...');
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

      await login(email, password, keepLoggedIn);
      handleSuccessfulLogin();
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
      
      await guestLogin();
      handleSuccessfulLogin();
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
      
      await googleLogin();
      handleSuccessfulLogin();
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
      
      await appleLogin();
      handleSuccessfulLogin();
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
    </>
  );
}
