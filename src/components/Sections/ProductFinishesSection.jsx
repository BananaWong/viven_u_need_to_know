import React, { useState, useRef, useCallback } from 'react';
import { useGSAP } from '../../hooks/useGSAP';
import { Label, RevealOnScroll } from '../Common/UI';
import Icons from '../Icons';
import { PRODUCT_FINISHES } from '../../constants/data.jsx';

const ProductFinishesSection = () => {
  // PC State
  const [viewMode, setViewMode] = useState('lineup'); // 'lineup' | 'detail'
  const [activeId, setActiveId] = useState(null);
  
  // Mobile State
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [flippedStates, setFlippedStates] = useState({}); // Track flip state for each card index
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const pcSectionRef = useRef(null);
  const panesRef = useRef([]);
  const imgsRef = useRef([]);
  const panelRef = useRef(null);
  const titleRef = useRef(null);
  const trackRef = useRef(null);

  const finishes = PRODUCT_FINISHES;

  // --- Mobile Touch Logic ---
  const cardWidth = 280;
  const cardGap = 16;
  const totalCardWidth = cardWidth + cardGap;

  const getTranslateForIndex = useCallback((idx) => {
      if (typeof window === 'undefined') return 0;
      const containerCenter = window.innerWidth < 768 ? window.innerWidth / 2 : 195;
      return containerCenter - idx * totalCardWidth - cardWidth / 2;
  }, [totalCardWidth, cardWidth]);

  const baseTranslate = getTranslateForIndex(mobileActiveIndex);
  const currentTranslate = baseTranslate + dragOffset;

  const handleTouchStart = (e) => {
      setIsDragging(true);
      setStartX(e.touches ? e.touches[0].clientX : e.clientX);
      setDragOffset(0);
  };

  const handleTouchMove = (e) => {
      if (!isDragging) return;
      const currentX = e.touches ? e.touches[0].clientX : e.clientX;
      setDragOffset(currentX - startX);
  };

  const handleTouchEnd = () => {
      setIsDragging(false);
      let newIndex = mobileActiveIndex;
      if (dragOffset < -50 && mobileActiveIndex < finishes.length - 1) newIndex = mobileActiveIndex + 1;
      else if (dragOffset > 50 && mobileActiveIndex > 0) newIndex = mobileActiveIndex - 1;
      
      if (newIndex !== mobileActiveIndex) {
          // Reset flips when changing cards
          setFlippedStates({});
      }
      setMobileActiveIndex(newIndex);
      setDragOffset(0);
  };

  const toggleFlip = (index, e) => {
      e.stopPropagation();
      if (index === mobileActiveIndex) {
          setFlippedStates(prev => ({ ...prev, [index]: !prev[index] }));
      } else {
          setMobileActiveIndex(index);
          setFlippedStates({});
      }
  };

  // --- PC 核心切换逻辑 ---
  const handleDetailSwitch = (id) => {
      if (id === activeId) return;
      setActiveId(id);
  };

  useGSAP(() => {
      if (!window.gsap) return;
      let mm = window.gsap.matchMedia();

      // --- PC ANIMATIONS ---
      mm.add("(min-width: 768px)", () => {
          if (viewMode === 'lineup') {
              window.gsap.to(titleRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });

              window.gsap.to(panelRef.current, {
                  x: 40,
                  opacity: 0,
                  duration: 0.6,
                  ease: 'power3.in',
                  overwrite: 'auto',
                  onComplete: () => window.gsap.set(panelRef.current, { pointerEvents: 'none' })
              });

              finishes.forEach((_, i) => {
                  window.gsap.to(panesRef.current[i], {
                      left: `${i * 25}%`,
                      width: '25%',
                      opacity: 1,
                      zIndex: 1,
                      filter: 'brightness(1)',
                      duration: 1.6,
                      ease: 'power3.inOut',
                      overwrite: 'auto'
                  });

                  window.gsap.to(imgsRef.current[i], {
                      left: `${i * 25 + 12.5}%`,
                      top: '52%',
                      xPercent: -50,
                      yPercent: -50,
                      y: 0,
                      scale: 0.55,
                      opacity: 1,
                      filter: 'blur(0px)',
                      duration: 1.6,
                      ease: 'power3.inOut',
                      overwrite: 'auto'
                  });
              });
          } else if (viewMode === 'detail' && activeId) {
              const activeIdx = finishes.findIndex(f => f.id === activeId);

              window.gsap.to(titleRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });

              finishes.forEach((f, i) => {
                  const isActive = i === activeIdx;
                  
                  window.gsap.to(panesRef.current[i], {
                      left: isActive ? '0%' : (i < activeIdx ? '-100%' : '100%'),
                      width: '100%', // All panes become full-width for sliding transition
                      opacity: 1,
                      zIndex: isActive ? 10 : 1,
                      filter: 'brightness(1)',
                      duration: 2.2,
                      ease: 'power4.inOut',
                      overwrite: 'auto'
                  });

                  if (isActive) {
                      window.gsap.to(imgsRef.current[i], {
                          // Match the pane's movement or fade out completely since sceneImg is present
                          left: '30%',
                          top: '52%',
                          xPercent: -50,
                          yPercent: -50,
                          scale: 0.55, // Keep original scale during transition
                          opacity: 0, // Fade out because sceneImg is taking over
                          filter: 'blur(10px)',
                          duration: 1.2,
                          ease: 'power4.out',
                          overwrite: 'auto'
                      });
                  } else {
                      window.gsap.to(imgsRef.current[i], {
                          left: i < activeIdx ? '-50%' : '150%',
                          opacity: 0,
                          scale: 0.4,
                          filter: 'blur(15px)',
                          duration: 1.2,
                          ease: 'power3.inOut',
                          overwrite: 'auto'
                      });
                  }
              });

              window.gsap.to(panelRef.current, {
                  x: 0,
                  y: 0,
                  opacity: 1,
                  duration: 1.2,
                  delay: 0.8,
                  ease: 'power3.out',
                  overwrite: 'auto',
                  onStart: () => window.gsap.set(panelRef.current, { pointerEvents: 'auto' })
              });
          }
      });

      return () => mm.revert();
  }, { dependencies: [viewMode, activeId] });

  const handlePaneClick = (id) => {
      if (viewMode === 'lineup') {
          setActiveId(id);
          setViewMode('detail');
      }
  };

  const handlePaneHover = (idx, isEnter) => {
      if (viewMode !== 'lineup') return;
      if (!window.gsap) return;
      if (window.innerWidth < 768) return; 

      if (isEnter) {
          window.gsap.to(panesRef.current[idx], { filter: 'brightness(1.08)', duration: 0.3, overwrite: 'auto' });
          window.gsap.to(imgsRef.current[idx], {
              y: -10,
              scale: 0.65,
              duration: 0.4,
              ease: 'power2.out',
              overwrite: 'auto'
          });
      } else {
          window.gsap.to(panesRef.current[idx], { filter: 'brightness(1)', duration: 0.4, overwrite: 'auto' });
          window.gsap.to(imgsRef.current[idx], {
              y: 0,
              scale: 0.55,
              duration: 0.5,
              ease: 'power2.inOut',
              overwrite: 'auto'
          });
      }
  };

  const activeData = finishes.find(f => f.id === activeId) || finishes[0];

  return (
    <section id="finishes" className="py-24 lg:py-32 bg-[#FCFBF9] relative overflow-hidden md:overflow-visible">
      <RevealOnScroll>
      <div className="max-w-[1440px] mx-auto px-0 md:px-12 relative z-10">

        <div ref={titleRef} className="text-center mb-8 md:mb-10 px-6">
          <Label className="text-[#f2663b]">Hardware Finishes</Label>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-[1.05]">Select your finish.</h2>
        </div>

        {/* --- PC VIEW (Interactive Panes) --- */}
        <div ref={pcSectionRef} className="hidden md:block relative w-full h-[600px] lg:h-[650px] rounded-[2.5rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] bg-stone-900"
             onClick={() => { if (viewMode === 'detail') setViewMode('lineup'); }}>

          {/* Layer 1: Panes */}
          <div className="absolute inset-0 z-0">
             {finishes.map((f, i) => (
                <div
                   key={`pane-${f.id}`}
                   ref={el => panesRef.current[i] = el}
                   className={`absolute top-0 bottom-0 ${viewMode === 'lineup' ? 'cursor-pointer' : ''} flex flex-col justify-start items-center pt-28 overflow-hidden`}
                   style={{ backgroundColor: f.color, left: `${i * 25}%`, width: '25%' }}
                   onClick={() => handlePaneClick(f.id)}
                   onMouseEnter={() => handlePaneHover(i, true)}
                   onMouseLeave={() => handlePaneHover(i, false)}
                >
                   {/* Lifestyle Scene Image (Visible in Detail Mode) */}
                   {f.sceneImg && (
                      <div className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${viewMode === 'detail' && activeId === f.id ? 'opacity-100' : 'opacity-0'}`}>
                         <img src={f.sceneImg} alt={`${f.label} lifestyle`} className="w-full h-full object-cover" />
                         {/* Overlay for text readability */}
                         <div className={`absolute inset-0 ${f.textMode === 'dark' ? 'bg-black/20' : 'bg-white/10'}`}></div>
                      </div>
                   )}
                   {/* Finish Label */}
                   <div className={`transition-all duration-700 ease-expo pointer-events-none px-4 text-center z-10 ${viewMode === 'lineup' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>                      <span className={`text-[13px] font-bold uppercase tracking-[0.2em] whitespace-nowrap ${f.textMode === 'dark' ? 'text-white/70' : 'text-black/60'}`}>
                         {f.label}
                      </span>
                   </div>
                </div>
             ))}
          </div>

          {/* Layer 2: Artifacts */}
          <div className="absolute inset-0 z-10 pointer-events-none">
             {finishes.map((f, i) => (
                <div
                   key={`img-${f.id}`}
                   ref={el => imgsRef.current[i] = el}
                   className="absolute flex items-center justify-center w-[460px] lg:w-[540px] h-[620px] lg:h-[700px]"
                   style={{ left: `${i * 25 + 12.5}%`, top: '55%', transform: `translate(-50%, -50%)` }}
                >
                   <img
                      src={f.img}
                      alt={f.label}
                      className="w-full h-full object-contain"
                      style={{ filter: 'drop-shadow(15px 25px 20px rgba(0,0,0,0.4))' }}
                   />
                </div>
             ))}
          </div>

          {/* Layer 3: Control Panel */}
          <div
             ref={panelRef}
             className={`absolute md:right-12 top-1/2 -translate-y-1/2 w-[420px] lg:w-[460px] p-12 rounded-[2rem] z-50 opacity-0 pointer-events-none flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.4)] transition-colors duration-700
             ${activeData.textMode === 'dark' ? 'bg-[#16181D]/90 backdrop-blur-3xl text-white' : 'bg-white/90 backdrop-blur-3xl text-[#2A2422]'}
             `}
             onClick={e => e.stopPropagation()}
          >
             <button
                onClick={() => setViewMode('lineup')}
                className={`absolute top-8 right-8 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors border
                ${activeData.textMode === 'dark' ? 'text-white/80 border-white/20 hover:bg-white/10 hover:text-white' : 'text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-[#f2663b]'}
                `}
                title="Back to lineup"
             >
                <Icons.ChevronLeft className="w-3 h-3" /> Back
             </button>

             <div className="mt-6">
                 <span className="font-mono text-[10px] uppercase tracking-[0.25em] block mb-3 font-bold text-[#f2663b]">
                    {activeData.id.replace('-', ' ')}
                 </span>
                 <h4 className="text-4xl lg:text-5xl font-semibold tracking-tight mb-4">{activeData.label}</h4>
                 <p className={`text-base font-normal leading-relaxed mb-10 ${activeData.textMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {activeData.desc}
                 </p>

                 <div className="flex items-center gap-4">
                     {finishes.map(f => (
                        <button key={f.id} onClick={() => handleDetailSwitch(f.id)}
                          className={`w-11 h-11 rounded-full border-[3px] transition-all duration-300 ease-out flex-shrink-0 ${
                            activeId === f.id
                              ? `scale-110 shadow-[0_0_15px_rgba(242,102,59,0.5)] border-[#f2663b]`
                              : `hover:scale-105 ${activeData.textMode === 'dark' ? 'border-white/20 hover:border-white/50' : 'border-black/10 hover:border-black/30'}`
                          }`}
                          style={{ background: f.color }}
                          title={f.label} />
                     ))}
                 </div>
             </div>
          </div>
        </div>

        {/* --- MOBILE VIEW (Swipe Carousel + 3D Flip) --- */}
        <div className="block md:hidden relative w-full h-[520px] overflow-hidden rounded-[2rem] mx-auto bg-[#FCFBF9] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-stone-100" style={{ maxWidth: 400 }}>
            <div 
                className="absolute inset-0 z-10 touch-pan-y [perspective:1000px]"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={isDragging ? handleTouchMove : undefined}
                onMouseUp={handleTouchEnd}
                onMouseLeave={isDragging ? handleTouchEnd : undefined}
            >
                {/* Cards Track */}
                <div 
                    ref={trackRef}
                    className="absolute top-6 bottom-20 flex items-stretch select-none"
                    style={{
                        gap: cardGap,
                        transform: `translateX(${currentTranslate}px)`,
                        transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
                    }}
                >
                    {finishes.map((f, i) => {
                        const isActive = i === mobileActiveIndex;
                        const isFlipped = flippedStates[i];
                        return (
                            <div 
                                key={f.id}
                                onClick={(e) => toggleFlip(i, e)}
                                className="relative flex-shrink-0 rounded-[2rem] cursor-pointer"
                                style={{
                                    width: cardWidth,
                                    transform: isActive ? "scale(1)" : "scale(0.92)",
                                    opacity: isActive ? 1 : 0.6,
                                    transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.5s ease"
                                }}
                            >
                                {/* 3D Flip Container */}
                                <div className="w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d]" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                                    
                                    {/* --- FRONT FACE --- */}
                                    <div className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden flex flex-col items-center justify-center shadow-lg [backface-visibility:hidden]" style={{ background: f.color }}>
                                        {/* Ambient Glow */}
                                        <div className="absolute -top-[30%] -left-[30%] w-[160%] h-[160%] pointer-events-none" style={{
                                            background: `radial-gradient(ellipse at 40% 30%, ${f.textMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 0%, transparent 70%)`
                                        }}></div>

                                        {/* Finish Label */}
                                        <div className="absolute top-8 left-0 right-0 text-center z-10">
                                            <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: f.textMode === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)" }}>
                                                {f.label}
                                            </span>
                                        </div>

                                        {/* Faucet Image */}
                                        <div className="w-full h-full flex items-center justify-center pt-10">
                                            <img src={f.img} alt={f.label} className="w-full h-full object-contain max-h-[85%] scale-[1.3] drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)] pointer-events-none" />
                                        </div>
                                        
                                        {/* Tap to flip hint */}
                                        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 transition-opacity duration-300" style={{ opacity: isActive && !isDragging ? 1 : 0 }}>
                                            <div className="bg-stone-900/5 backdrop-blur-md border border-stone-900/10 rounded-full px-4 py-1.5 text-[10px] font-semibold tracking-wide flex items-center gap-1.5" style={{ color: f.textMode === "dark" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)" }}>
                                                <Icons.Refresh className="w-3 h-3" /> Tap for details
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- BACK FACE --- */}
                                    <div className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden flex flex-col shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] p-8 pt-10" style={{ background: f.textMode === "dark" ? "#16181D" : "#ffffff", border: `1px solid ${f.textMode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}` }}>
                                        <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-[#f2663b] mb-2">
                                            {f.id.replace("-", " ")}
                                        </span>
                                        <h3 className="text-3xl font-semibold tracking-tight leading-none mb-4" style={{ color: f.textMode === "dark" ? "#fff" : "#2A2422" }}>
                                            {f.label}
                                        </h3>
                                        <p className="text-[13px] leading-relaxed mb-auto" style={{ color: f.textMode === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                                            {f.desc}
                                        </p>
                                        
                                        {/* Back hint */}
                                        <div className="flex justify-center mt-6">
                                            <div className="bg-stone-900/5 rounded-full px-4 py-1.5 text-[10px] font-semibold tracking-wide flex items-center gap-1.5" style={{ color: f.textMode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>
                                                <Icons.Refresh className="w-3 h-3" /> Tap to flip back
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Dots */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                    {finishes.map((f, i) => (
                        <button
                            key={f.id}
                            onClick={(e) => { e.stopPropagation(); setMobileActiveIndex(i); }}
                            className="h-2 rounded-full border-none cursor-pointer p-0"
                            style={{
                                width: i === mobileActiveIndex ? 24 : 8,
                                background: i === mobileActiveIndex ? "#f2663b" : "rgba(0,0,0,0.15)",
                                transition: "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)"
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>

      </div>
      </RevealOnScroll>
    </section>
  );
};

export default ProductFinishesSection;
