import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  forcePlay?: boolean;
  onComplete?: () => void;
}

export default function SplashScreen({ forcePlay = false, onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if user has visited or if we are forcing the play
    const hasVisited = localStorage.getItem('how-much-is-left-visited');
    
    if (!hasVisited || forcePlay) {
      setShow(true);
      setIsFadingOut(false);
      
      // Step 1: Display splash animation, then start fading out
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
        
        // Step 2: Unmount splash screen after fade-out transition finishes
        const unmountTimer = setTimeout(() => {
          setShow(false);
          if (!forcePlay) {
            localStorage.setItem('how-much-is-left-visited', 'true');
          }
          if (onComplete) onComplete();
        }, 1000); // Matches the 1s transition duration
        
        return () => clearTimeout(unmountTimer);
      }, 3800); // Show splash for 3.8 seconds

      return () => clearTimeout(fadeOutTimer);
    } else {
      if (onComplete) onComplete();
    }
  }, [forcePlay, onComplete]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden select-none transition-all duration-1000 ease-in-out ${
        isFadingOut 
          ? 'opacity-0 scale-[1.05] pointer-events-none' 
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #0f1612 0%, #030403 100%)'
      }}
    >
      {/* Self-contained styling for complex custom animations */}
      <style>{`
        @keyframes pulseGlow {
          0% {
            opacity: 0.3;
            transform: scale(0.9);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.15);
          }
        }

        @keyframes drawWave {
          0% {
            stroke-dashoffset: 1200;
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes fadeInUpLogo {
          0% {
            opacity: 0;
            transform: translateY(25px) scale(0.9);
            filter: blur(10px);
          }
          40% {
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes trackingExpand {
          0% {
            letter-spacing: -0.3em;
            opacity: 0;
            filter: blur(5px);
          }
          40% {
            opacity: 0.6;
          }
          100% {
            letter-spacing: 0.15em;
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes subtlePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .splash-glow-center {
          background: radial-gradient(circle, rgba(78, 222, 163, 0.18) 0%, transparent 65%);
          filter: blur(35px);
          animation: pulseGlow 4s infinite alternate ease-in-out;
        }

        .wave-line-animate {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: drawWave 4.5s infinite cubic-bezier(0.25, 1, 0.5, 1);
        }

        .logo-reveal {
          animation: fadeInUpLogo 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .text-tracking-expand {
          animation: trackingExpand 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        .logo-image-glow {
          box-shadow: 0 0 40px rgba(78, 222, 163, 0.1);
          animation: subtlePulse 5s infinite ease-in-out 1.6s;
        }
      `}</style>

      {/* 1. Backdrop Glowing Aura Pulse */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full splash-glow-center" />
      </div>

      {/* 2. SVG Flowing Wavy Lines (Matches the curvy ribbons in the icon) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none select-none" 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="none"
      >
        <path 
          d="M -100,500 C 200,350 350,650 500,500 C 650,350 800,650 1100,500" 
          fill="none" 
          stroke="#4edea3" 
          strokeWidth="1.2" 
          className="wave-line-animate text-emerald-400/30"
          style={{ animationDelay: '0s' }}
        />
        <path 
          d="M -100,520 C 180,380 330,680 500,520 C 670,360 820,660 1100,520" 
          fill="none" 
          stroke="#4edea3" 
          strokeWidth="1.2" 
          className="wave-line-animate text-[#4edea3]/20"
          style={{ animationDelay: '0.3s' }}
        />
        <path 
          d="M -100,480 C 220,320 370,620 500,480 C 630,340 780,640 1100,480" 
          fill="none" 
          stroke="#34d399" 
          strokeWidth="0.8" 
          className="wave-line-animate text-emerald-500/10"
          style={{ animationDelay: '0.6s' }}
        />
      </svg>

      {/* 3. Core Brand Animation Block */}
      <div className="flex flex-col items-center justify-center z-10 gap-8 max-w-xs text-center">
        
        {/* Animated Icon Image */}
        <div className="logo-reveal opacity-0 scale-90 flex items-center justify-center">
          <div className="relative p-1 bg-zinc-950/60 rounded-3xl border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] logo-image-glow">
            <img 
              src="/favicon.png" 
              alt="How Much Is Left Logo" 
              className="w-32 h-32 object-contain rounded-[22px] select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Text Typography Reveals */}
        <div className="flex flex-col items-center justify-center gap-1.5 mt-2">
          <h2 className="text-zinc-100 text-2xl font-extrabold tracking-widest uppercase text-tracking-expand opacity-0 font-sans">
            how much is left
          </h2>
          <span className="text-emerald-400/60 text-[11px] font-bold tracking-[0.25em] uppercase opacity-0 font-mono animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000 fill-mode-forwards">
            balance & savings goal
          </span>
        </div>

      </div>

      {/* 4. Sleek Loading Micro-Bar indicator */}
      <div className="absolute bottom-12 w-32 h-[2px] bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#4edea3] to-emerald-400 rounded-full w-full origin-left scale-x-0 animate-in fade-in fill-mode-forwards"
          style={{
            animation: 'scaleX 3.5s cubic-bezier(0.1, 0.85, 0.25, 1) forwards',
            transformOrigin: 'left'
          }}
        />
      </div>
      
      <style>{`
        @keyframes scaleX {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
