import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { UnifiedPreferencesProvider } from './contexts/UnifiedPreferencesContext';
import PrivateRoute from './features/auth/PrivateRoute';
import NetworkStatus from './components/common/network/NetworkStatus';
import CacheDetector from './components/CacheDetector';
import ErrorBoundary from './components/common/safety/ErrorBoundary';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';

import { registerSW } from './utils/service/serviceWorkerRegistration';
import { queryClient } from './lib/queryClient';
import errorHandler from './utils/error/errorHandler';
import './utils/logging/LoggingManager'; // Initialize centralized logging
import './styles/global.css';
import './styles/themes.css';
import './App.css';
import './performance.css';
// Events feature styles
import './features/events/styles/index.css';
import './features/events/styles/accessibility.css';

// Lazy load components for better performance
const WelcomePage = React.lazy(() => import('./login_flow/components/WelcomePage'));
const AboutPage = React.lazy(() => import('./login_flow/components/AboutPage'));
const Login = React.lazy(() => import('./features/auth/Login'));
const Signup = React.lazy(() => import('./features/auth/Signup'));
const Home = React.lazy(() => import('./pages/home/Home'));
const Profile = React.lazy(() => import('./features/profile/pages/Profile'));
const Search = React.lazy(() => import('./pages/search/Search'));
const AddPost = React.lazy(() => import('./pages/addpost/AddPost'));
const Messages = React.lazy(() => import('./pages/messages/Messages'));
const PostDetail = React.lazy(() => import('./pages/postdetail/PostDetail'));
const StoryDetail = React.lazy(() => import('./features/stories/StoryDetail'));
const StorySharePage = React.lazy(() => import('./features/stories/StorySharePage'));
const VerificationPage = React.lazy(() => import('./pages/verification/VerificationPage'));
const VideoVerificationPage = React.lazy(() => import('./features/profile/pages/VideoVerification'));
const Settings = React.lazy(() => import('./features/settings/pages/Settings'));
const MomentsPage = React.lazy(() => import('./pages/moments/MomentsPage'));

// Events Platform Components
const EventPage = React.lazy(() => import('./features/events/pages/EventPage'));
const EventDetailPage = React.lazy(() => import('./features/events/pages/EventDetailPage'));
const AthleteProfilePage = React.lazy(() => import('./features/events/pages/AthleteProfilePage'));

// Event route wrappers to handle params
const EventDetailWrapper = () => {
  const { eventId } = require('react-router-dom').useParams();
  const navigate = require('react-router-dom').useNavigate();
  return React.createElement(EventDetailPage, { 
    eventId: eventId || '', 
    onBack: () => navigate('/events') 
  });
};

const AthleteProfileWrapper = () => {
  const { userId } = require('react-router-dom').useParams();
  const navigate = require('react-router-dom').useNavigate();
  const { currentUser } = require('./contexts/AuthContext').useAuth();
  return React.createElement(AthleteProfilePage, { 
    userId: userId || '', 
    isOwnProfile: currentUser?.uid === userId,
    onBack: () => navigate('/events') 
  });
};

// Athlete Onboarding Components
const SportSelectionPage = React.lazy(() => import('./features/athlete-onboarding/components/SportSelectionPage'));
const PositionSelectionPage = React.lazy(() => import('./features/athlete-onboarding/components/PositionSelectionPage'));
const MultiSportPositionFlow = React.lazy(() => import('./features/athlete-onboarding/components/MultiSportPositionFlow'));
const SubcategorySelectionPage = React.lazy(() => import('./features/athlete-onboarding/components/SubcategorySelectionPage'));
const SpecializationPage = React.lazy(() => import('./features/athlete-onboarding/components/SpecializationPage'));
const AthleteAboutPage = React.lazy(() => import('./features/athlete-onboarding/components/AthleteAboutPage'));

// Debug Components (only in development)
// Language Testing Panel removed

// Optimized loading component for Suspense fallback
const LoadingSpinner: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    transition: 'opacity 0.2s ease-in-out'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid var(--accent-primary)',
      borderTop: '3px solid transparent',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}></div>
  </div>
);

function AppContent(): React.JSX.Element {
  const location = useLocation();

  useEffect(() => {
    // Conservative cache management - prevent infinite reload
    const manageCache = (): void => {
      const currentVersion = '2.1.0';
      
      // Set document title
      document.title = 'AmaPlayer - Sports Social Media Platform v2.1';
      
      // Set version in localStorage (don't clear everything)
      try {
        const storedVersion = localStorage.getItem('amaplayer-version');
        if (!storedVersion || storedVersion !== currentVersion) {
          localStorage.setItem('amaplayer-version', currentVersion);
        }
      } catch (e) {
        // Silently handle localStorage errors
      }
      
      // Only clear service workers if they exist
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            registrations.forEach(registration => registration.unregister());
          }
        });
      }
    };
    
    // Run cache management
    manageCache();
    
    // Register service worker for offline functionality - Phase 1
    registerSW({
      onSuccess: () => {
        errorHandler.logError(new Error('Service worker registered successfully'), 'ServiceWorker', 'info');
      },
      onUpdate: () => {
        errorHandler.logError(new Error('New version available'), 'ServiceWorker-Update', 'info');
      }
    });
  }, []);

  return (
    <div className="App">
      <ErrorBoundary name="App-Root" userFriendlyMessage="The app encountered an unexpected error. Please refresh the page.">
        <CacheDetector />
        <NetworkStatus />
        <Suspense fallback={<LoadingSpinner />}>
          <ErrorBoundary name="App-Routes" userFriendlyMessage="There was an issue loading this page. Please try again.">
            <Routes>
              {/* Login Flow Routes */}
              <Route path="/" element={<WelcomePage key={location.key} />} />
              <Route path="/about/:role" element={<AboutPage />} />
              <Route path="/login/:role" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Athlete Onboarding Routes */}
              <Route path="/athlete-onboarding/sport" element={<SportSelectionPage />} />
              <Route path="/athlete-onboarding/position" element={<PositionSelectionPage />} />
              <Route path="/athlete-onboarding/multi-position" element={<MultiSportPositionFlow />} />
              <Route path="/athlete-onboarding/subcategory" element={<SubcategorySelectionPage />} />
              <Route path="/athlete-onboarding/specialization" element={<SpecializationPage />} />
              <Route path="/about/athlete" element={<AthleteAboutPage />} />
              <Route path="/home" element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } />
              <Route path="/search" element={
                <PrivateRoute>
                  <Search />
                </PrivateRoute>
              } />
              <Route path="/moments" element={
                <PrivateRoute>
                  <MomentsPage />
                </PrivateRoute>
              } />
              <Route path="/add-post" element={
                <PrivateRoute>
                  <AddPost />
                </PrivateRoute>
              } />
              <Route path="/messages" element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              } />
              <Route path="/events" element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <EventPage />
                  </Suspense>
                </PrivateRoute>
              } />
              <Route path="/events/create" element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <EventPage />
                  </Suspense>
                </PrivateRoute>
              } />
              <Route path="/events/:eventId" element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <EventDetailWrapper />
                  </Suspense>
                </PrivateRoute>
              } />
              <Route path="/events/profile/:userId" element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <AthleteProfileWrapper />
                  </Suspense>
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/profile/:userId" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } />
              <Route path="/post/:postId" element={
                <PrivateRoute>
                  <PostDetail />
                </PrivateRoute>
              } />
              <Route path="/story/:storyId" element={
                <PrivateRoute>
                  <StoryDetail />
                </PrivateRoute>
              } />
              <Route path="/story-share/:storyId" element={<StorySharePage />} />
              <Route path="/verify/:verificationId" element={<VerificationPage />} />
              <Route path="/verify/:userId/:videoId" element={<VideoVerificationPage />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <ChunkErrorBoundary>
      <ErrorBoundary name="App-Providers" userFriendlyMessage="Failed to initialize the application. Please refresh the page.">
        <Router>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <UnifiedPreferencesProvider>
                <AppContent />
              </UnifiedPreferencesProvider>
            </AuthProvider>
          </QueryClientProvider>
        </Router>
      </ErrorBoundary>
    </ChunkErrorBoundary>
  );
}

export default App;
