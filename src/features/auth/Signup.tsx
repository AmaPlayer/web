import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import './Auth.css';

export default function Signup() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { signup, googleLogin, appleLogin, currentUser } = useAuth();
  const navigate = useNavigate();

  // Load full name from personal details if available
  useEffect(() => {
    const pendingDetails = localStorage.getItem('pendingPersonalDetails');
    if (pendingDetails) {
      try {
        const details = JSON.parse(pendingDetails);
        if (details.fullName) {
          setDisplayName(details.fullName);
        }
      } catch (err) {
        console.error('Error parsing pending personal details:', err);
      }
    }
  }, []);

  // No longer need to check for redirect since we're using popup method

  // Helper function to save pending details after authentication
  async function savePendingDetails(): Promise<void> {
    const { auth } = await import('../../lib/firebase');
    const user = auth.currentUser;

    if (!user) return;

    const userService = (await import('../../services/api/userService')).default;

    // Check for pending athlete profile and save it
    const pendingAthleteProfile = localStorage.getItem('pendingAthleteProfile');
    if (pendingAthleteProfile) {
      try {
        const athleteData = JSON.parse(pendingAthleteProfile);

        // Use athleteProfileService for proper data saving with denormalization
        const athleteProfileService = (await import('../../services/api/athleteProfileService')).default;

        // Ensure we have all required fields
        if (athleteData.sports && athleteData.sports.length > 0 &&
            athleteData.position && athleteData.subcategory) {
          await athleteProfileService.createAthleteProfile({
            userId: user.uid,
            sports: athleteData.sports,
            position: athleteData.position,
            subcategory: athleteData.subcategory,
            specializations: athleteData.specializations || {}
          });

          localStorage.removeItem('pendingAthleteProfile');
          console.log('✅ Athlete profile saved after signup with athleteProfileService');
        } else {
          console.warn('⚠️ Incomplete athlete profile data, skipping save');
        }
      } catch (err) {
        console.error('Error saving pending athlete profile:', err);
      }
    }

    // Check for pending personal details and save them
    const pendingDetails = localStorage.getItem('pendingPersonalDetails');
    if (pendingDetails) {
      try {
        const details = JSON.parse(pendingDetails);

        // Convert height if provided
        const heightInCm = details.heightFeet || details.heightInches
          ? Math.round((parseFloat(details.heightFeet || '0') * 30.48) + (parseFloat(details.heightInches || '0') * 2.54))
          : null;

        // Build profile data object, only including fields with values
        const profileData: any = {
          displayName: details.fullName,
          dateOfBirth: details.dateOfBirth,
          gender: details.gender,
          country: details.country,
          state: details.state,
          city: details.city,
          location: `${details.city}, ${details.state}, ${details.country}`
        };

        // Only add optional fields if they have values
        if (details.bio) profileData.bio = details.bio;
        if (heightInCm) profileData.height = heightInCm.toString();
        if (details.weight) profileData.weight = details.weight;
        if (details.phone) profileData.mobile = details.phone;

        await userService.updateUserProfile(user.uid, profileData);

        localStorage.removeItem('pendingPersonalDetails');
        console.log('✅ Personal details saved after signup');
      } catch (err) {
        console.error('Error saving pending personal details:', err);
      }
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

      // Save pending details if they exist
      await savePendingDetails();

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

      // googleLogin() now uses signInWithPopup - returns user credential directly
      const userCredential = await googleLogin();
      console.log('Google signup successful, handling user:', userCredential.user.email);

      // Save pending athlete profile data and navigate to home
      await savePendingDetails();
      navigate('/home');
    } catch (error) {
      setError('Failed to sign up with Google');
      console.error('Google signup error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignup(): Promise<void> {
    try {
      setError('');
      setLoading(true);
      await appleLogin();

      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save pending details if they exist
      await savePendingDetails();

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

