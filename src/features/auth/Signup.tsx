import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
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
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);

      console.log('Signup form data:', { email, displayName, passwordLength: password.length });

      await signup(email, password, displayName);

      // Wait for auth state to update and get the current user
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check for pending personal details and save them
      const pendingDetails = localStorage.getItem('pendingPersonalDetails');
      if (pendingDetails) {
        try {
          // Import auth to get current user
          const { auth } = await import('../../../lib/firebase');
          const user = auth.currentUser;

          if (user) {
            const details = JSON.parse(pendingDetails);
            const userService = (await import('../../../services/api/userService')).default;

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

            localStorage.removeItem('pendingPersonalDetails');
            console.log('✅ Personal details saved after signup');
          }
        } catch (err) {
          console.error('Error saving pending personal details:', err);
        }
      }

      navigate('/home');
    } catch (error: any) {
      console.error('Signup form error:', error);

      // Display the specific error message from the auth context
      const errorMessage = error.message || 'Failed to create an account';
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
      setError('Failed to sign up with Google');
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
          setError('Apple Sign-in is not enabled. Please contact support.');
        } else if (firebaseError.code === 'auth/cancelled-popup-request') {
          setError('Sign-in was cancelled');
        } else {
          setError('Failed to sign up with Apple');
        }
      } else {
        setError('Failed to sign up with Apple');
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
        <h1>AmaPlayer</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <input
              type="text"
              placeholder="Full Name"
              value={displayName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} type="submit" className="auth-btn">
            Sign Up
          </button>
        </form>
        <div className="social-login">
          <button 
            disabled={loading} 
            className="auth-btn google-btn"
            onClick={handleGoogleSignup}
          >
            Sign up with Google
          </button>
          <button 
            disabled={loading} 
            className="auth-btn apple-btn"
            onClick={handleAppleSignup}
          >
            Sign up with Apple
          </button>
        </div>
        
        {/* Diagnostic button for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="diagnostic-section" style={{ marginTop: '20px', padding: '10px', border: '1px dashed #ccc', borderRadius: '5px' }}>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
              Development Tools
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
              {diagnosticLoading ? 'Running Diagnostics...' : 'Test Firebase Connection'}
            </button>
          </div>
        )}
        
        <div className="auth-link-section">
          <p>Already have an account?</p>
          <button 
            className="auth-link-btn"
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
