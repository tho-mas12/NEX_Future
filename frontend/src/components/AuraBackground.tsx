import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface AuraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Cosmic Ash - Aura Gradient with Film Grain
 * Composites over body background (#100e0b in dark mode, #f8fafc in light mode).
 * Screen blend on dark, Multiply blend on light.
 */
export const AuraBackground: React.FC<AuraBackgroundProps> = ({
  children,
  className = '',
  style = {},
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      {/* Layer 1 - Linear gradient */}
      <div
        className="aura-layer-1"
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'linear-gradient(140deg, #0d0b16 0%, #1e1b32 40%, #312e4d 70%, #433f68 100%)'
            : 'linear-gradient(140deg, #f1f5f9 0%, #e0e7ff 40%, #c7d2fe 70%, #e2e8f0 100%)',
          mixBlendMode: 'normal',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Layer 2 - Radial glow (screen on dark / multiply on light) */}
      <div
        className="aura-layer-2"
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(circle at 55% 40%, rgba(129,140,248,0.28) 0%, transparent 55%)'
            : 'radial-gradient(circle at 55% 40%, rgba(99,102,241,0.20) 0%, transparent 60%)',
          mixBlendMode: isDark ? 'screen' : 'multiply',
          filter: 'blur(135px)',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Layer 3 - Film Grain Texture Overlay */}
      <div
        className="aura-grain"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: isDark ? 'overlay' : 'soft-light',
          opacity: isDark ? 0.85 : 0.45,
          pointerEvents: 'none',
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix
              type="matrix"
              values="0.181 0.608 0.061 0 0.075
                    0.181 0.608 0.061 0 0.075
                    0.181 0.608 0.061 0 0.075
                    0     0     0     1 0"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* Page Content sits cleanly above all ambient layers */}
      <div style={{ position: 'relative', zIndex: 1 }} className="w-full">
        {children}
      </div>
    </div>
  );
};
