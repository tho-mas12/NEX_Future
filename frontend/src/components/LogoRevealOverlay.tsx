import React, { useRef, useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface LogoRevealOverlayProps {
  onComplete: () => void;
  storageKey?: string;
  forceShow?: boolean;
}

export const LogoRevealOverlay: React.FC<LogoRevealOverlayProps> = ({
  onComplete,
  storageKey = 'nex_logo_revealed_v1',
  forceShow = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  useEffect(() => {
    // If not forced and already seen in this session, skip smoothly
    if (!forceShow && sessionStorage.getItem(storageKey)) {
      setVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      // Safety timeout: dismiss if video takes more than 10 seconds
      handleEnd();
    }, 10000);

    return () => clearTimeout(timer);
  }, [forceShow, storageKey]);

  const handleEnd = () => {
    if (fading) return;
    setFading(true);
    sessionStorage.setItem(storageKey, 'true');
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 800); // 800ms fade transition
  };

  const handleStartPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setNeedsUserInteraction(false);
      }).catch(() => {
        // Fallback dismiss if autoplay blocked entirely
        handleEnd();
      });
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#100e0b] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ minHeight: '100vh', minWidth: '100vw' }}
    >
      {/* High-fidelity full screen cover video player */}
      <video
        ref={videoRef}
        src="/logo-reveal.mp4"
        autoPlay
        playsInline
        muted={isMuted}
        preload="auto"
        onEnded={handleEnd}
        onLoadedData={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {
              setNeedsUserInteraction(true);
            });
          }
        }}
        onError={() => {
          // If video can't load, dismiss gracefully immediately
          handleEnd();
        }}
        className="w-full h-full object-contain md:object-cover max-h-screen max-w-screen"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(129,140,248,0.25))',
        }}
      />

      {/* Atmospheric subtle ambient backdrop lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(129,140,248,0.12) 0%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      />

      {/* Manual play button if mobile browser blocks autoplay */}
      {needsUserInteraction && (
        <button
          onClick={handleStartPlay}
          className="absolute z-20 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-2xl shadow-amber-500/40 animate-pulse transition active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Enter NEX Experience</span>
        </button>
      )}

      {/* Control bar: Skip & Mute toggle */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition active:scale-95"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={handleEnd}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/15 transition active:scale-95 flex items-center gap-1.5"
        >
          <span>Skip Intro</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
