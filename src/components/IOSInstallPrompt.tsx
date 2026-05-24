import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

export default function IOSInstallPrompt() {
  const { language } = useFinanceStore();
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect if it's an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    // 2. Detect if it's running in standalone mode (already installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    // 3. Detect if the user previously closed the prompt within the last 7 days
    const lastDismissed = localStorage.getItem('ios_pwa_prompt_dismissed');
    let isRecentlyDismissed = false;

    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      const currentTime = new Date().getTime();
      // 7 days in milliseconds: 7 * 24 * 60 * 60 * 1000 = 604800000
      if (currentTime - dismissedTime < 604800000) {
        isRecentlyDismissed = true;
      }
    }

    // Only show if the user is on iOS, NOT in standalone mode, and has NOT recently dismissed it
    if (isIOS && !isStandalone && !isRecentlyDismissed) {
      // Delay slightly for a smoother entry after loading
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Persist dismissal timestamp in localStorage
    localStorage.setItem('ios_pwa_prompt_dismissed', new Date().getTime().toString());
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom-8 duration-500 ease-out"
      style={{
        boxShadow: '0 0 40px rgba(78, 222, 163, 0.08), 0 20px 50px rgba(0,0,0,0.85)'
      }}
    >
      {/* Glow highlight */}
      <div className="absolute -top-[1px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#4edea3]/40 to-transparent" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">📲</span>
          <h4 className="font-bold text-zinc-100 text-[15px] tracking-tight">
            {language === 'TH' ? 'ติดตั้งแอปบน iPhone / iPad' : 'Install App on your iOS Device'}
          </h4>
        </div>
        <button 
          onClick={handleDismiss}
          className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 leading-normal mb-4">
        {language === 'TH' 
          ? 'เพิ่มแอปนี้ไปยังหน้าจอโฮมของคุณเพื่อการเข้าถึงที่รวดเร็ว โหลดไว และใช้งานแบบเต็มหน้าจอเสมือนแอปจริง!' 
          : 'Add this application to your Home Screen for instant loading, full-screen view, and fluid native experience.'}
      </p>

      {/* Steps List */}
      <div className="flex flex-col gap-3 border-t border-zinc-900/60 pt-3">
        {/* Step 1 */}
        <div className="flex items-center gap-3.5">
          <div className="w-6.5 h-6.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center text-[11px] font-mono font-bold text-[#4edea3] shrink-0">
            1
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium leading-relaxed">
            <span>
              {language === 'TH' 
                ? 'แตะปุ่มส่งออก / แชร์ บนแถบด้านล่างของ Safari' 
                : 'Tap the Share button in Safari\'s bottom toolbar'}
            </span>
            <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-300 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-3.5">
          <div className="w-6.5 h-6.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center text-[11px] font-mono font-bold text-[#4edea3] shrink-0">
            2
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium leading-relaxed">
            <span>
              {language === 'TH' 
                ? 'เลื่อนลงมาแล้วกดปุ่ม' 
                : 'Scroll down and select'}
            </span>
            <strong className="text-[#4edea3] font-bold">
              {language === 'TH' ? '“เพิ่มไปยังหน้าจอโฮม”' : '“Add to Home Screen”'}
            </strong>
            <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-300 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Safe Area Padding Spacer */}
      <div className="h-1 pb-safe" />
    </div>
  );
}
