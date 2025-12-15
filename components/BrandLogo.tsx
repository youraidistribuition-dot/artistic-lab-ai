
import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  fallbackClass?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className, fallbackClass = "text-xl" }) => {
  const [error, setError] = useState(false);

  if (error) {
    // FAIL-SAFE: Neutral placeholder if asset is missing
    return (
      <div className={`flex items-center justify-center gap-1 ${fallbackClass}`}>
        <span className="font-black tracking-tighter">ArtisticLab</span>
        <span className="font-black tracking-tighter">AI</span>
      </div>
    );
  }

  return (
    <img 
      src="logo.png" 
      alt="ArtisticLab AI Official Logo" 
      // STRICT RULES: 
      // 1. object-contain (No distortion)
      // 2. No filters/invert (No color changes)
      // 3. pointer-events-none (Pure visual)
      className={`object-contain select-none pointer-events-none ${className}`}
      onError={() => setError(true)}
    />
  );
};
