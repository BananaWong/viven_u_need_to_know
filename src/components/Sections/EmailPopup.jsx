import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Common/UI';
import Icons from '../Icons';

const EmailPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const popupRef = useRef(null);
  const overlayRef = useRef(null);

  const hasShownRef = useRef(false);

  useEffect(() => {
    // Check if user has already interacted
    const hasInteracted = localStorage.getItem('viven-email-popup-closed');
    const isSubscribed = localStorage.getItem('viven-is-subscribed');
    
    if (hasInteracted || isSubscribed) return;

    const triggerPopup = () => {
      if (hasShownRef.current) return;
      hasShownRef.current = true;
      setIsOpen(true);
      window.removeEventListener('scroll', handleScroll);
    };

    // Show popup after 6 seconds
    const timer = setTimeout(triggerPopup, 6000);

    const handleScroll = () => {
      const problemSection = document.getElementById('problem');
      if (problemSection) {
        const rect = problemSection.getBoundingClientRect();
        // Trigger when the top of the second section (ProblemSection) is in view
        if (rect.top <= window.innerHeight * 0.85) {
          triggerPopup();
        }
      } else {
        // Fallback: 20% scroll
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > 20) {
          triggerPopup();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isOpen && window.gsap) {
      const tl = window.gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      tl.fromTo(popupRef.current, 
        { scale: 0.9, opacity: 0, y: 20 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "power4.out" }, 
        "-=0.2"
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    localStorage.setItem('viven-email-popup-closed', Date.now().toString());
    if (window.gsap) {
      window.gsap.to(popupRef.current, { scale: 0.9, opacity: 0, y: 20, duration: 0.4, onComplete: () => setIsOpen(false) });
      window.gsap.to(overlayRef.current, { opacity: 0, duration: 0.4 });
    } else {
      setIsOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      // 1. Write to Supabase (Internal Backup)
      const { error: supabaseError } = await supabase
        .from('subscribers')
        .insert([{ email, source: 'popup_v1', created_at: new Date() }]);

      if (supabaseError) console.warn('Supabase backup failed:', supabaseError);

      // 2. Sync to Klaviyo (Marketing Engine)
      // Corrected Client-side Subscription format
      const klaviyoOptions = {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              custom_source: 'Homepage Popup',
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email: email
                  }
                }
              }
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: 'WUxXA4' // Klaviyo List ID
                }
              }
            }
          }
        })
      };

      const klaviyoResponse = await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=XZjFAr`, klaviyoOptions);
      
      if (!klaviyoResponse.ok) {
        const errorData = await klaviyoResponse.json();
        console.error('Klaviyo Sync Error:', errorData);
      }

      localStorage.setItem('viven-is-subscribed', 'true');
      setStatus('success');
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      console.error('Subscription error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-[#1C1917]/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Popup Card */}
      <div
        ref={popupRef}
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-[0_30px_100px_-10px_rgba(0,0,0,0.5)] border border-stone-200"
      >
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors z-20"
        >
          <Icons.Close className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left: Content */}
          <div className="p-8 md:p-12 flex flex-col justify-center w-full">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tighter text-[#2A2422] mb-4 leading-none">
              Stay in the flow.
            </h3>

            <p className="text-stone-500 text-sm md:text-base leading-relaxed mb-8">
              Join our list for exclusive health insights, early product drops, and <span className="text-[#2A2422] font-semibold">limited member pricing.</span>
            </p>

            {status === 'success' ? (
              <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 text-white">
                  <Icons.Check className="w-6 h-6" strokeWidth={3} />
                </div>
                <p className="text-green-800 font-bold tracking-tight text-lg">You're on the list!</p>
                <p className="text-green-600 text-xs mt-1">Check your inbox for a welcome surprise.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-stone-50 border border-stone-200 rounded-xl px-5 text-base focus:outline-none focus:border-[#f2663b] focus:ring-4 focus:ring-[#f2663b]/5 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <Icons.Zap className="w-4 h-4 text-[#f2663b]" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={status === 'loading'}
                  className={`h-14 w-full text-sm font-bold uppercase tracking-widest ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {status === 'loading' ? 'Joining...' : 'Subscribe Now'}
                </Button>

                {status === 'error' && (
                  <p className="text-red-500 text-[10px] mt-2 text-center font-bold">Something went wrong. Please try again.</p>
                )}

                <p className="text-[10px] text-stone-400 mt-4 text-center leading-relaxed">
                  By subscribing, you agree to our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600 transition-colors">Privacy Policy</a>. No spam, ever.
                </p>
              </form>
            )}          </div>
        </div>

        {/* Subtle Bottom Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-stone-100 via-[#f2663b] to-stone-100 opacity-30"></div>
      </div>
    </div>
  );
};

export default EmailPopup;
