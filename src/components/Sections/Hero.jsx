import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../Common/UI';
import Icons from '../Icons';

const Hero = () => {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const [videoFallback, setVideoFallback] = useState(false);

  // --- Customization States (Hero Layout Lab v2.1) ---
  
  // order: array of indices [0, 2]. 
  // 0: "Your water should protect your health" (H1)
  // 2: The long description paragraph (H3)
  const [order] = useState([0, 2]);
  
  // largeIndex: which index from the original set is currently the Large H1 style.
  const [largeIndex] = useState(0);

  // --- Font Size States (px) ---
  const [largeFontSize, setLargeFontSize] = useState(window.innerWidth < 768 ? (window.innerWidth < 380 ? 36 : 42) : 88);
  const [smallFontSize, setSmallFontSize] = useState(window.innerWidth < 768 ? (window.innerWidth < 380 ? 18 : 20) : 32);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setLargeFontSize(window.innerWidth < 380 ? 36 : 42);
        setSmallFontSize(window.innerWidth < 380 ? 18 : 20);
      } else {
        setLargeFontSize(88);
        setSmallFontSize(32);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari requires these to be set via JS for autoplay to work
    video.defaultMuted = true;
    video.muted = true;
    // webkit-playsinline for older Safari (iOS < 10)
    video.setAttribute('webkit-playsinline', '');

    const tryPlay = () => {
      video.play().catch((err) => {
        console.warn("Hero video autoplay failed:", err);
      });
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener('canplay', tryPlay, { once: true });
    }

    // Fallback: if timeupdate never fires within 3s, Safari failed to render — show poster image
    let rendered = false;
    const onTimeUpdate = () => { rendered = true; };
    video.addEventListener('timeupdate', onTimeUpdate, { once: true });
    const fallbackTimer = setTimeout(() => {
      if (!rendered) setVideoFallback(true);
    }, 3000);

    return () => {
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Re-run animation when layout or font size changes
  useEffect(() => {
    if (!window.gsap) return;
    const ctx = window.gsap.context(() => {
      let split;
      if (window.SplitType) {
        try {
          split = new window.SplitType('.hero-title-anim', { types: 'words' });
        } catch (e) {
          console.error("SplitType error:", e);
        }
      }

      const timeline = window.gsap.timeline();

      if (split && split.words && split.words.length > 0) {
        timeline.from(split.words, {
          opacity: 0,
          y: 60,
          rotationX: -30,
          stagger: 0.05,
          duration: 0.8,
          ease: 'back.out(1.7)',
        });
      } else {
        timeline.from('.hero-title-anim', {
          opacity: 0,
          y: 60,
          duration: 0.8,
          ease: 'back.out(1.7)',
        });
      }

      timeline.from('.hero-desc-anim', {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
      }, "-=0.4");

      timeline.from('#hero-ctas', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power2.out',
      }, "-=0.6");

      timeline.from('#hero-badges > div', {
        opacity: 0,
        x: -20,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
      }, "-=0.5");

    }, heroRef);
    return () => ctx.revert();
  }, [order, largeIndex, largeFontSize, smallFontSize]); 

  // --- Dynamic Content Definition ---
  const contentBlocks = [
    {
      id: 0,
      label: 'Protect',
      large: <>Your water should<br /><span className="text-[#f2663b]" style={{fontSize: '1.1em'}}>protect your health.</span></>,
      small: "Your water should protect your health."
    },
    {
      id: 1,
      label: 'Tap',
      large: <>Traditional faucets<br /><span className="text-[#f2663b]" style={{fontSize: '1.1em'}}>don’t.</span></>,
      small: "Traditional faucets don’t."
    },
    {
      id: 2,
      label: 'Description',
      large: <>Other faucets do not. Viven's is the only faucet that removes <span className="text-[#f2663b]">microplastics, PFAS, THMs</span> and more while adding electrolytes and molecular hydrogen to feel better everyday.</>,
      small: (
        <>
          Other faucets do not. Viven's is the only faucet that removes <strong className="font-bold">
            <span className="relative inline-block group cursor-help underline decoration-dotted decoration-white/50 underline-offset-4 hover:decoration-white transition-colors">
              microplastics
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-[#1C1917] border border-stone-700 text-xs sm:text-sm text-stone-300 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 text-center shadow-2xl font-sans font-normal normal-case tracking-normal leading-relaxed drop-shadow-none translate-y-1 group-hover:translate-y-0">
                90% of US tap water has microplastics in it
              </span>
            </span>
            ,{' '}
            <span className="relative inline-block group cursor-help underline decoration-dotted decoration-white/50 underline-offset-4 hover:decoration-white transition-colors">
              PFAS
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 sm:w-72 p-3 bg-[#1C1917] border border-stone-700 text-xs sm:text-sm text-stone-300 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 text-center shadow-xl font-sans font-normal normal-case tracking-normal leading-relaxed drop-shadow-none translate-y-1 group-hover:translate-y-0">
                Labeled a carcinogen in 2023, more than 179M Americans are exposed to PFAS, also known as forever chemicals.
              </span>
            </span>
            ,{' '}
            <span className="relative inline-block group cursor-help underline decoration-dotted decoration-white/50 underline-offset-4 hover:decoration-white transition-colors">
              THMs
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 sm:w-72 p-3 bg-[#1C1917] border border-stone-700 text-xs sm:text-sm text-stone-300 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 text-center shadow-xl font-sans font-normal normal-case tracking-normal leading-relaxed drop-shadow-none translate-y-1 group-hover:translate-y-0">
                Where there is chlorine/chloramine there are THMs (and chloroform, and HAA9/5) - all linked to cancer and/or infertility, etc.
              </span>
            </span>
          </strong> and more while adding electrolytes and molecular hydrogen to feel better everyday.
        </>
      )
    }
  ];

  // Styling Classes
  const largeBaseClasses = "hero-title-anim font-semibold tracking-tighter leading-[1] md:leading-[0.95] text-white drop-shadow-sm mb-4 md:mb-12";
  const smallBaseClasses = "hero-desc-anim text-white font-semibold leading-relaxed mb-3 md:mb-8";
  const tinyBaseClasses = "hero-desc-anim text-white font-normal leading-relaxed mb-10 md:mb-12 max-w-3xl";

  return (
    <section ref={heroRef} className="relative min-h-[100dvh] md:min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800/20 via-[#1C1917] to-[#1C1917] text-white pt-24 md:pt-32 pb-12 flex items-center overflow-hidden transition-colors duration-1000">
      
      {/* --- Settings Control Panel (Hidden for Dev/Prod Deployment) --- */}
      {/* 
      <div className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
        ... (Rest of the settings UI)
      </div>
      */}

      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0">
           {/* Desktop Video
               - filter on wrapper div (not video) avoids Safari black screen compositing bug
               - translate3d on video forces Safari to open a dedicated GPU compositing layer
               - videoFallback shows static poster if timeupdate never fires within 3s */}
           <div
             className="hidden md:block w-full h-full"
             style={{ filter: 'brightness(95%) contrast(105%)' }}
           >
             {videoFallback ? (
               <div
                 className="w-full h-full"
                 style={{
                   backgroundImage: `url('https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto,so_0/v1773485850/Herosection_d2abca.jpg')`,
                   backgroundSize: 'cover',
                   backgroundPosition: 'center',
                 }}
               />
             ) : (
               <video
                 ref={videoRef}
                 autoPlay
                 muted
                 loop
                 playsInline
                 preload="auto"
                 poster="https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto,so_0/v1773485850/Herosection_d2abca.jpg"
                 className="w-full h-full object-cover"
                 style={{
                   WebkitTransform: 'translate3d(0,0,0)',
                   transform: 'translate3d(0,0,0)',
                 }}
               >
                 <source src="https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_mp4,vc_h264/v1773485850/Herosection_d2abca.mp4" type="video/mp4" />
               </video>
             )}
           </div>
           
           {/* Mobile Image */}
           <div 
             className="block md:hidden w-full h-full" 
             style={{ 
               backgroundImage: `url('https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772954695/backend_ehibwe.webp')`,
               backgroundSize: '100% auto',
               backgroundPosition: 'right center',
               backgroundRepeat: 'no-repeat',
               filter: 'brightness(80%)' 
             }}
           ></div>
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/60 md:from-[#1C1917]/50 via-[#1C1917]/20 to-transparent z-0 pointer-events-none"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 md:from-[#1C1917]/70 via-transparent to-transparent pointer-events-none"></div>
      </div>
      
      {/* Dynamic Key forces complete GSAP/SplitType re-render */}
      <div key={`${order.join('-')}-${largeIndex}-${largeFontSize}-${smallFontSize}`} className="relative z-10 max-w-[1440px] mx-auto w-full px-6 md:px-12 pt-8 md:pt-12 pb-12 md:pb-20 flex items-center h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full">
          <div className="col-span-1 lg:col-span-8 xl:col-span-10">
            
            {order.map((blockIdx) => {
              const block = contentBlocks[blockIdx];
              const isLarge = largeIndex === blockIdx;
              const isDescription = blockIdx === 2;
              
              let styleClass = isLarge ? largeBaseClasses : smallBaseClasses;
              if (!isLarge && isDescription) styleClass = tinyBaseClasses;

              return (
                <div 
                  key={blockIdx} 
                  className={styleClass} 
                  style={{ fontSize: isLarge ? `${largeFontSize}px` : `${smallFontSize}px` }}
                >
                  {isLarge ? block.large : block.small}
                </div>
              );
            })}

            <div id="hero-ctas" className="mb-6 md:mb-12 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-5 w-full sm:w-auto">
               <a href="#reserve" className="block w-full sm:w-fit">
                 <Button variant="primary" className="h-12 md:h-14 px-8 md:px-10 text-sm md:text-base font-semibold w-full sm:w-fit">
                   Reserve the Kitchen Faucet+ for $50
                 </Button>
               </a>
            </div>

            <div id="hero-badges" className="flex flex-wrap items-center gap-y-3 gap-x-6 md:gap-8 text-[11px] md:text-xs font-bold uppercase tracking-widest text-white/70 md:text-white/60">
                <div className="flex items-center gap-2 md:gap-3 group cursor-default">
                    <svg viewBox="0 0 100 100" className="h-8 md:h-12 w-auto text-white opacity-90 md:opacity-80 transition-all duration-500 ease-out md:group-hover:text-[#f2663b] md:group-hover:opacity-100 md:group-hover:scale-110 md:group-hover:drop-shadow-[0_0_12px_rgba(242,102,59,0.6)]">
                       <g style={{ transformOrigin: '50px 50px' }} className="transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:group-hover:rotate-[360deg]">
                           <circle cx="50" cy="50" r="42" fill="currentColor" fillOpacity="0.1" />
                           <path d="M50 14 A 36 36 0 1 1 14 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                           <path d="M14 50 L 4 60 M 14 50 L 24 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                       </g>
                       <g style={{ transformOrigin: '50px 50px', transform: 'scaleX(-1)' }}>
                           <path d="M50 33 V 67 M 43 42.5 C 43 35, 57 35, 57 42.5 C 57 50, 43 50, 43 57.5 C 43 65, 57 65, 57 57.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                       </g>
                    </svg>
                    <span className="leading-tight transition-colors duration-500 group-hover:text-white">100% Money-Back<br/>Guarantee</span>
                </div>
                <div className="hidden sm:block w-px h-6 md:h-8 bg-white/10"></div>
                <div className="flex items-center gap-2 md:gap-3 group cursor-default">
                    <img src="https://res.cloudinary.com/dsyxtnpgm/image/upload/v1771587494/NSF_International_logo.svg_1_srmspw.webp" alt="NSF Certified" className="h-10 md:h-12 w-auto object-contain grayscale opacity-90 md:opacity-80 mix-blend-screen transition-all duration-500 ease-out md:group-hover:grayscale-0 md:group-hover:opacity-100 md:group-hover:scale-110" />
                    <span className="leading-tight transition-colors duration-500 group-hover:text-white">NSF/ANSI<br/>Certified</span>
                </div>
                <div className="hidden sm:block w-px h-6 md:h-8 bg-white/10"></div>
                <div className="flex items-center gap-2 md:gap-3 group cursor-default">
                    <svg viewBox="0 0 100 100" className="h-10 md:h-12 w-auto text-white opacity-90 md:opacity-80 transition-all duration-500 ease-out md:group-hover:text-[#f2663b] md:group-hover:opacity-100 md:group-hover:scale-110 md:group-hover:drop-shadow-[0_0_12px_rgba(242,102,59,0.6)]">
                       <path d="M50 15 C50 35, 65 50, 85 50 C65 50, 50 65, 50 85 C50 65, 35 50, 15 50 C35 50, 50 35, 50 15 Z" fill="currentColor" className="transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:group-hover:scale-110" style={{ transformOrigin: '50px 50px' }} />
                       <circle cx="50" cy="50" r="8" fill="currentColor" fillOpacity="0.4" />
                    </svg>
                    <span className="leading-tight transition-colors duration-500 group-hover:text-white text-center md:text-left">
                        Designed by<span className="hidden md:inline"><br/></span><span className="inline md:hidden"> </span>ex-Kohler and ex-Apple
                    </span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
