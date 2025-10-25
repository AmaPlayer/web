import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { indianStates, getCitiesByState } from '../data/indianLocations';
import userService from '../../../services/api/userService';
import './PersonalDetailsForm.css';

interface PersonalDetails {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  country: string;
  state: string;
  city: string;
  phone: string;
  bio: string;
}

export default function PersonalDetailsForm() {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  // Load saved data from localStorage or use defaults
  const [formData, setFormData] = useState<PersonalDetails>(() => {
    const saved = localStorage.getItem('pendingPersonalDetails');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved personal details:', e);
      }
    }
    return {
      fullName: currentUser?.displayName || '',
      dateOfBirth: '',
      gender: '',
      height: '',
      weight: '',
      country: 'India',
      state: '',
      city: '',
      phone: '',
      bio: ''
    };
  });

  const [errors, setErrors] = useState<Partial<PersonalDetails>>({});

  useEffect(() => {
    if (formData.state) {
      const stateCities = getCitiesByState(formData.state);
      setCities(stateCities);
      // Reset city if state changes
      if (!stateCities.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setCities([]);
    }
  }, [formData.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof PersonalDetails]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonalDetails> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
      if (age > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (formData.height && (parseFloat(formData.height) < 50 || parseFloat(formData.height) > 300)) {
      newErrors.height = 'Please enter a valid height (50-300 cm)';
    }

    if (formData.weight && (parseFloat(formData.weight) < 20 || parseFloat(formData.weight) > 300)) {
      newErrors.weight = 'Please enter a valid weight (20-300 kg)';
    }

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // If user is already authenticated, save directly to Firebase
      if (currentUser) {
        // Update Firebase Auth display name
        await updateUserProfile({
          displayName: formData.fullName
        });

        // Save personal details to Firestore
        await userService.updateUserProfile(currentUser.uid, {
          displayName: formData.fullName,
          bio: formData.bio || undefined,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          height: formData.height || undefined,
          weight: formData.weight || undefined,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          mobile: formData.phone || undefined,
          location: `${formData.city}, ${formData.state}, ${formData.country}`
        });

        console.log('✅ Personal details saved successfully');
        navigate('/home');
      } else {
        // No user authenticated - save to localStorage and navigate to login
        localStorage.setItem('pendingPersonalDetails', JSON.stringify(formData));
        console.log('✅ Personal details saved to localStorage, redirecting to login');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error saving personal details:', error);
      alert('Failed to save personal details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Clear any saved data and navigate to login
    localStorage.removeItem('pendingPersonalDetails');
    navigate('/login');
  };

  return (
    <div className="personal-details-container">
      <div className="personal-details-card">
        <div className="personal-details-header">
          <h1>Complete Your Profile</h1>
          <p>Help us personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="personal-details-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label htmlFor="dateOfBirth">
              Date of Birth <span className="required">*</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={errors.dateOfBirth ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
          </div>

          {/* Gender */}
          <div className="form-group">
            <label htmlFor="gender">
              Gender <span className="required">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={errors.gender ? 'error' : ''}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>

          {/* Height and Weight */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="height">Height (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className={errors.height ? 'error' : ''}
                placeholder="e.g., 175"
                min="50"
                max="300"
              />
              {errors.height && <span className="error-message">{errors.height}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className={errors.weight ? 'error' : ''}
                placeholder="e.g., 70"
                min="20"
                max="300"
              />
              {errors.weight && <span className="error-message">{errors.weight}</span>}
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled
              className="disabled"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state">
                State <span className="required">*</span>
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={errors.state ? 'error' : ''}
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="city">
                City <span className="required">*</span>
              </label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? 'error' : ''}
                disabled={!formData.state}
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone">Mobile Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself, your sports journey, achievements..."
              rows={4}
              maxLength={500}
            />
            <span className="character-count">{formData.bio.length}/500</span>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSkip}
              className="btn-secondary"
              disabled={loading}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
