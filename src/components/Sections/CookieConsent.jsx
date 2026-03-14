import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../Common/UI';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef(null);

  const updateGtagConsent = (accepted) => {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': accepted ? 'granted' : 'denied',
        'ad_storage': accepted ? 'granted' : 'denied'
      });
    }
  };

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('viven-cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      // If already accepted, ensure gtag is updated
      updateGtagConsent(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible && bannerRef.current && window.gsap) {
      window.gsap.fromTo(
        bannerRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.5 }
      );
    }
  }, [isVisible]);

  const handleChoice = (accepted) => {
    localStorage.setItem('viven-cookie-consent', accepted ? 'accepted' : 'declined');
    updateGtagConsent(accepted);
    
    if (window.gsap) {
      window.gsap.to(bannerRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => setIsVisible(false)
      });
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={bannerRef}
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[9999] pointer-events-auto"
    >
      <div className="bg-[#1C1917]/95 backdrop-blur-xl border border-stone-800 p-5 md:p-6 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden relative group">
        {/* Subtle Gradient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#f2663b]/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-[#f2663b]/15 transition-colors duration-700"></div>
        
        <div className="relative z-10">
          <h3 className="text-white font-mono text-[11px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2663b] animate-pulse"></span>
            Cookie Consent
          </h3>
          
          <p className="text-stone-400 text-[13px] leading-relaxed mb-6 font-sans">
            We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies as described in our <Link to="/privacy" className="text-white hover:text-[#f2663b] underline underline-offset-4 transition-colors">Privacy Policy</Link>.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button 
              variant="primary" 
              className="flex-1 !h-10 !text-[9px]"
              onClick={() => handleChoice(true)}
            >
              Accept All
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 !h-10 !text-[9px] !bg-transparent !border-stone-700 hover:!border-stone-500"
              onClick={() => handleChoice(false)}
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
