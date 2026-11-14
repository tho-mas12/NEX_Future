import React from 'react';

interface AuraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Midnight Sapphire - Aura Gradient
 * Theme: Light (Backdrop #faf8f2).
 * Two multiply-blend blur layers composite against the body background.
 */
export const AuraBackground: React.FC<AuraBackgroundProps> = ({
  children,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`aura-bg ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        width: '100%',
        ...style,
      }}
    >
      {/* Layer 1 - multiply linear gradient */}
      <div
        className="aura-layer-1"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(61,90,255,0.12) 28%, rgb(255,255,255) 18%, rgb(45,55,135) 68%, rgb(20,25,60) 100%)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Layer 2 - multiply linear gradient with higher sapphire saturation */}
      <div
        className="aura-layer-2"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(61,90,255,0.22) 34%, rgb(255,255,255) 66%, rgb(45,55,135) 82%, rgb(20,25,60) 100%)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Page Content cleanly positioned above ambient layers */}
      <div style={{ position: 'relative', zIndex: 1 }} className="w-full">
        {children}
      </div>
    </div>
  );
};
