import React, { useState } from 'react';

export interface DelayedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const DelayedImage: React.FC<DelayedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/hackathon-bg.jpg',
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Shimmer Placeholder while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-[#1E293B] animate-pulse" />
      )}

      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...rest}
      />
    </div>
  );
};
