import React from 'react';

interface ParallaxSectionProps {
  imageUrl: string;
  minHeight?: string;
  children?: React.ReactNode;
  overlayOpacity?: number;
  className?: string;
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({ 
  imageUrl, 
  minHeight = 'min-h-[400px]', 
  children,
  overlayOpacity = 0.7, // Increased default for better text readability
  className = ''
}) => {
  const overlayStyle: React.CSSProperties = {
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
  };

  return (
    <div
      className={`relative bg-cover bg-center bg-fixed ${minHeight} ${className}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundColor: '#1a1a1a' // Fallback background color
      }}
      aria-label="Parallax background image section" // Accessibility
      onError={(e) => {
        console.log('ParallaxSection background image failed to load:', imageUrl);
        // Handle error by applying a fallback style
        const element = e.currentTarget as HTMLDivElement;
        element.style.backgroundColor = '#1a1a1a';
      }}
    >
      <div className="absolute inset-0" style={overlayStyle} aria-hidden="true"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-4">
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;