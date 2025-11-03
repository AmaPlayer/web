import React, { useState, useEffect } from 'react';
import { reactionSystem } from '@features/events/services/reactionSystem';

interface CelebrationGifProps {
  sport: string;
  trigger?: boolean;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export const CelebrationGif: React.FC<CelebrationGifProps> = ({
  sport,
  trigger = false,
  duration = 3000,
  onComplete,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentGif, setCurrentGif] = useState<string | null>(null);
  const [availableGifs, setAvailableGifs] = useState<string[]>([]);

  useEffect(() => {
    loadCelebrationGifs();
  }, [sport]);

  useEffect(() => {
    if (trigger && availableGifs.length > 0) {
      showCelebration();
    }
  }, [trigger, availableGifs]);

  const loadCelebrationGifs = async () => {
    try {
      const gifs = await reactionSystem.getCelebrationGifs(sport);
      setAvailableGifs(gifs);
    } catch (error) {
      console.error('Failed to load celebration GIFs:', error);
    }
  };

  const showCelebration = () => {
    if (availableGifs.length === 0) return;

    // Select random GIF
    const randomGif = availableGifs[Math.floor(Math.random() * availableGifs.length)];
    setCurrentGif(randomGif);
    setIsVisible(true);

    // Hide after duration
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentGif(null);
        onComplete?.();
      }, 300); // Wait for fade out animation
    }, duration);
  };

  if (!currentGif || !isVisible) {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black bg-opacity-50 pointer-events-none
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      <div className="relative">
        <img
          src={currentGif}
          alt="Celebration"
          className="max-w-sm max-h-sm rounded-lg shadow-2xl animate-bounce"
          style={{
            animation: 'celebrationPulse 0.5s ease-in-out infinite alternate'
          }}
        />
        
        {/* Celebration text overlay */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg animate-pulse">
            🎉 Awesome! 🎉
          </div>
        </div>
      </div>

      <style>{`
        @keyframes celebrationPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

interface CelebrationTriggerProps {
  sport: string;
  children: React.ReactNode;
  onCelebration?: () => void;
  className?: string;
}

export const CelebrationTrigger: React.FC<CelebrationTriggerProps> = ({
  sport,
  children,
  onCelebration,
  className = ''
}) => {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleTrigger = () => {
    setShowCelebration(true);
    onCelebration?.();
  };

  const handleComplete = () => {
    setShowCelebration(false);
  };

  return (
    <div className={className}>
      <div onClick={handleTrigger}>
        {children}
      </div>
      
      <CelebrationGif
        sport={sport}
        trigger={showCelebration}
        onComplete={handleComplete}
      />
    </div>
  );
};