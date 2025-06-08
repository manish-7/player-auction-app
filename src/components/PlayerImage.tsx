import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { imageCacheService } from '../services/imageCacheService';

interface PlayerImageProps {
  imageUrl?: string;
  playerName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const PlayerImage: React.FC<PlayerImageProps> = ({
  imageUrl,
  playerName,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  // Check cache and load image
  useEffect(() => {
    if (!imageUrl) {
      setImageLoading(false);
      setImageError(false);
      setCachedImageUrl(null);
      return;
    }

    // Reset states when imageUrl changes
    setImageError(false);
    setImageLoading(true);
    setCachedImageUrl(null);

    // Check if image is already cached
    const cached = imageCacheService.getCachedImage(imageUrl);
    if (cached) {
      setCachedImageUrl(cached);
      setImageLoading(false);
      return;
    }

    // If image was preloaded, use the original URL directly
    if (imageCacheService.isPreloaded(imageUrl)) {
      setCachedImageUrl(imageUrl);
      setImageLoading(false);
      return;
    }

    // Load image through cache service with fallback
    imageCacheService.loadImage(imageUrl)
      .then(cached => {
        setCachedImageUrl(cached);
        setImageLoading(false);
      })
      .catch(() => {
        // Fallback to direct URL if cache service fails (e.g., CORS issues)
        console.warn(`Cache service failed for ${imageUrl}, using direct URL`);
        setCachedImageUrl(imageUrl);
        setImageLoading(false);
      });
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Show placeholder if no image URL, image failed to load, or still loading
  const showPlaceholder = !imageUrl || imageError;
  const displayImageUrl = cachedImageUrl || imageUrl;

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-full bg-gray-100 flex items-center justify-center`}>
      {!showPlaceholder && displayImageUrl && (
        <img
          src={displayImageUrl}
          alt={`${playerName} photo`}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {(showPlaceholder || imageLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <User className={`${iconSizes[size]} text-gray-400`} />
        </div>
      )}
      
      {imageLoading && !imageError && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
        </div>
      )}
    </div>
  );
};

export default PlayerImage;
