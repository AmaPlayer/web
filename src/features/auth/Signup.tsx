import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageSelector from '../../components/common/LanguageSelector';
import { useLanguage } from '../../contexts/UnifiedPreferencesContext';
import { runFirebaseDiagnostics } from '../../utils/diagnostics/firebaseDiagnostic';
import './Auth.css';

export default function Signup() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState<boolean>(false);
  const { signup, googleLogin, appleLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleDiagnostic(): Promise<void> {
    setDiagnosticLoading(true);
    try {
      await runFirebaseDiagnostics();
      alert('Diagnostic complete! Check the browser console for results.');
    } catch (error) {
      console.error('Diagnostic error:', error);
      alert('Diagnostic failed. Check the browser console for details.');
    } finally {
      setDiagnosticLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError(t('passwordsDoNotMatch'));
    }

    try {
      setError('');
      setLoading(true);
      
      console.log('Signup form data:', { email, displayName, passwordLength: password.length });
      
      await signup(email, password, displayName);
      navigate('/home');
    } catch (error: any) {
      console.error('Signup form error:', error);
      
      // Display the specific error message from the auth context
      const errorMessage = error.message || t('failedToCreateAccount');
      setError(errorMessage);
    }
    setLoading(false);
  }

  async function handleGoogleSignup(): Promise<void> {
    try {
      setError('');
      setLoading(true);
      await googleLogin();
      navigate('/home');
    } catch (error) {
      setError(t('failedToSignUpWithGoogle'));
      console.error('Google signup error:', error);
    }
    setLoading(false);
  }

  async function handleAppleSignup(): Promise<void> {
    try {
      setError('');
      setLoading(true);
      await appleLogin();
      navigate('/home');
    } catch (error) {
      console.error('Apple signup error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/operation-not-allowed') {
          setError(t('appleSignInNotEnabled'));
        } else if (firebaseError.code === 'auth/cancelled-popup-request') {
          setError(t('signInCancelled'));
        } else {
          setError(t('failedToSignUpWithApple'));
        }
      } else {
        setError(t('failedToSignUpWithApple'));
      }
    }
    setLoading(false);
  }

  return (
    <div className="auth-container auth-page">
      <div className="auth-controls-only">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <h1>{t('amaplayer')}</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <input
              type="text"
              placeholder={t('fullName')}
              value={displayName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder={t('confirmPassword')}
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} type="submit" className="auth-btn">
            {t('signUp')}
          </button>
        </form>
        <div className="social-login">
          <button 
            disabled={loading} 
            className="auth-btn google-btn"
            onClick={handleGoogleSignup}
          >
            {t('signUpWithGoogle')}
          </button>
          <button 
            disabled={loading} 
            className="auth-btn apple-btn"
            onClick={handleAppleSignup}
          >
            {t('signUpWithApple')}
          </button>
        </div>
        
        {/* Diagnostic button for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="diagnostic-section" style={{ marginTop: '20px', padding: '10px', border: '1px dashed #ccc', borderRadius: '5px' }}>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
              {t('developmentTools')}
            </p>
            <button 
              disabled={diagnosticLoading}
              className="auth-btn"
              onClick={handleDiagnostic}
              style={{ 
                backgroundColor: '#f0f0f0', 
                color: '#333', 
                fontSize: '12px',
                padding: '8px 16px'
              }}
            >
              {diagnosticLoading ? t('runningDiagnostics') : t('testFirebaseConnection')}
            </button>
          </div>
        )}
        
        <div className="auth-link-section">
          <p>{t('alreadyHaveAccount')}</p>
          <button 
            className="auth-link-btn"
            onClick={() => navigate('/login')}
          >
            {t('login')}
          </button>
        </div>
      </div>
    </div>
  );
}
