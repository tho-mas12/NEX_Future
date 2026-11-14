import React, { useRef, useState, useEffect } from 'react';

interface LogoRevealOverlayProps {
  onComplete: () => void;
  storageKey?: string;
  forceShow?: boolean;
}

export const LogoRevealOverlay: React.FC<LogoRevealOverlayProps> = ({
  onComplete,
  storageKey = 'nex_logo_revealed_v2',
  forceShow = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Check session storage if not forced
    if (!forceShow && sessionStorage.getItem(storageKey)) {
      setVisible(false);
      onComplete();
      return;
    }

    // Safety timeout in case video stalls or ends
    const timer = setTimeout(() => {
      handleEnd();
    }, 7000);

    return () => clearTimeout(timer);
  }, [forceShow, storageKey]);

  const handleEnd = () => {
    if (fading) return;
    setFading(true);
    sessionStorage.setItem(storageKey, 'true');
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 600); // 600ms smooth fade transition
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleEnd}
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-500 cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        backgroundColor: '#faf8f2', // Midnight sapphire base background
      }}
    >
      {/* Ambient background glow layers matching Midnight Sapphire */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(61,90,255,0.15) 28%, rgb(255,255,255) 18%, rgb(45,55,135) 68%, rgb(20,25,60) 100%)',
          mixBlendMode: 'multiply',
          filter: 'blur(100px)',
        }}
        aria-hidden="true"
      />

      {/* Responsive video container: scales seamlessly across mobile portrait, tablet, and desktop */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-6">
        <video
          ref={videoRef}
          src="/logo-reveal.mp4"
          autoPlay
          playsInline
          muted
          preload="auto"
          onEnded={handleEnd}
          onError={handleEnd}
          className="max-h-[92vh] max-w-[95vw] w-auto h-auto object-contain rounded-3xl shadow-2xl transition-transform duration-300"
          style={{
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 15px 35px rgba(45, 55, 135, 0.25))',
          }}
        />
      </div>
    </div>
  );
};
