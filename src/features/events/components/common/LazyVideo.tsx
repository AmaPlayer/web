import React, { useState, useEffect, useRef } from 'react';

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
}

/**
 * LazyVideo component that loads videos only when they enter the viewport
 * Uses Intersection Observer API for efficient lazy loading
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  className = '',
  controls = true
}) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVideoSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={poster}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      controls={controls}
      onLoadedData={handleLoadedData}
      preload="none"
    >
      Your browser does not support the video tag.
    </video>
  );
};
