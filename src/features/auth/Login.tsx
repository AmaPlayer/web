import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login, guestLogin, googleLogin, appleLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/home');
    } catch (error) {
      setError('Failed to log in');
    }
    setLoading(false);
  }

  async function handleGuestLogin(): Promise<void> {
    try {
      setError('');
      setLoading(true);
      await guestLogin();
      navigate('/home');
    } catch (error) {
      setError('Failed to log in as guest');
    }
    setLoading(false);
  }

  async function handleGoogleLogin(): Promise<void> {
    try {
      setError('');
      setLoading(true);
      await googleLogin();
      navigate('/home');
    } catch (error) {
      setError('Failed to log in with Google');
      console.error('Google login error:', error);
    }
    setLoading(false);
  }

  async function handleAppleLogin(): Promise<void> {
    try {
      setError('');
      setLoading(true);
      await appleLogin();
      navigate('/home');
    } catch (error) {
      console.error('Apple login error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/operation-not-allowed') {
          setError('Apple Sign-in is not enabled. Please contact support.');
        } else if (firebaseError.code === 'auth/cancelled-popup-request') {
          setError('Sign-in was cancelled');
        } else {
          setError('Failed to log in with Apple');
        }
      } else {
        setError('Failed to log in with Apple');
      }
    }
    setLoading(false);
  }

  return (
    <div className="auth-container auth-page">
      <div className="auth-header">
        <button 
          className="homepage-btn"
          onClick={() => navigate('/')}
          title="Go to Homepage"
        >
          🏠 <span>Home</span>
        </button>
        <div className="auth-controls">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
      <div className="auth-card">
        <h1>{t('amaplayer')}</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} type="submit" className="auth-btn">
            {t('login')}
          </button>
        </form>
        <div className="social-login">
          <button 
            disabled={loading} 
            className="auth-btn google-btn"
            onClick={handleGoogleLogin}
          >
            🏃‍♂️ Join AmaPlayer with Google
          </button>
          <button 
            disabled={loading} 
            className="auth-btn apple-btn"
            onClick={handleAppleLogin}
          >
            Sign in with Apple
          </button>
        </div>
        <div className="guest-login">
          <button 
            disabled={loading} 
            onClick={handleGuestLogin} 
            className="auth-btn guest-btn"
          >
            {t('continueAsGuest')}
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
  );
}
