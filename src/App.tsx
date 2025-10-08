import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './features/auth/PrivateRoute';
import NetworkStatus from './components/common/network/NetworkStatus';
import CacheDetector from './components/CacheDetector';
import ErrorBoundary from './components/common/safety/ErrorBoundary';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';

import { registerSW } from './utils/serviceWorkerRegistration';
import { queryClient } from './lib/queryClient';
import errorHandler from './utils/errorHandler';
import './utils/logging/LoggingManager'; // Initialize centralized logging
import './styles/global.css';
import './styles/themes.css';
import './App.css';
import './performance.css';

// Lazy load components for better performance
const LandingPage = React.lazy(() => import('./pages/landingpage/LandingPage'));
const Login = React.lazy(() => import('./features/auth/Login'));
const Signup = React.lazy(() => import('./features/auth/Signup'));
const Home = React.lazy(() => import('./pages/home/Home'));
const Profile = React.lazy(() => import('./features/profile/pages/Profile'));
const Search = React.lazy(() => import('./pages/search/Search'));
const AddPost = React.lazy(() => import('./pages/addpost/AddPost'));
const Messages = React.lazy(() => import('./pages/messages/Messages'));
const Events = React.lazy(() => import('./pages/events/Events'));
const PostDetail = React.lazy(() => import('./pages/postdetail/PostDetail'));
const StoryDetail = React.lazy(() => import('./features/stories/StoryDetail'));
const StorySharePage = React.lazy(() => import('./features/stories/StorySharePage'));
const VerificationPage = React.lazy(() => import('./pages/verification/VerificationPage'));

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
  useEffect(() => {
    // Conservative cache management - prevent infinite reload
    const manageCache = (): void => {
      const currentVersion = '2.1.0';
      
      console.log('APP: Starting conservative cache management...');
      
      // Set document title
      document.title = 'AmaPlayer - Sports Social Media Platform v2.1';
      
      // Set version in localStorage (don't clear everything)
      try {
        const storedVersion = localStorage.getItem('amaplayer-version');
        if (!storedVersion || storedVersion !== currentVersion) {
          localStorage.setItem('amaplayer-version', currentVersion);
          console.log('APP: Updated version to', currentVersion);
        }
      } catch (e) {
        // Silently handle localStorage errors
      }
      
      // Only clear service workers if they exist
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            console.log('APP: Clearing service workers...');
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/app-landing" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
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
                  <Events />
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
            <ThemeProvider>
              <LanguageProvider>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </LanguageProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </Router>
      </ErrorBoundary>
    </ChunkErrorBoundary>
  );
}

export default App;
