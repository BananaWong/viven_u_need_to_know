import React, { useState, useEffect, useRef } from 'react';
import { Label, RevealOnScroll } from '../Common/UI';
import Icons from '../Icons';
import { CALENDAR_EVENTS } from '../../constants/data.jsx';

const FamilyCalendarSection = () => {
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [isHoveringList, setIsHoveringList] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setNeedsScroll(el.scrollHeight > el.clientHeight);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const events = CALENDAR_EVENTS;

  useEffect(() => {
    if (isHoveringList) return;
    const interval = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % events.length);
    }, 4500); 
    return () => clearInterval(interval);
  }, [isHoveringList, events.length]);

  useEffect(() => {
    const activeEl = document.getElementById(`event-${activeEventIndex}`);
    const container = containerRef.current;
    if (activeEl && container) {
      const targetScrollTop = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [activeEventIndex]);

  const activeEvent = events[activeEventIndex];

  return (
    <section id="lifestyle" className="py-24 md:py-32 bg-[#EAE8E2]">
      <RevealOnScroll>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          <div className="text-center mb-12 md:mb-20">
             <Label className="text-[#f2663b]">Daily Routine</Label>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] mb-4 md:mb-6 leading-[1.05]">
               Synced with your life.
             </h2>
             <p className="text-sm md:text-base font-normal text-stone-500 leading-relaxed max-w-2xl mx-auto">
               Viven isn't just an appliance; it's a seamless part of your family's daily schedule.
             </p>
          </div>

          <div 
            className="bg-[#F2F1F6] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col md:flex-row relative w-full mx-auto backdrop-blur-xl"
            style={{ aspectRatio: window.innerWidth >= 768 ? '2.27 / 1' : 'auto' }}
          >
             
             <div 
                className="w-full md:w-[320px] bg-white border-b md:border-b-0 md:border-r border-stone-200/80 flex flex-col z-20 shrink-0 h-[280px] md:h-auto overflow-hidden"
                onMouseEnter={() => setIsHoveringList(true)}
                onMouseLeave={() => setIsHoveringList(false)}
             >
                <div className="pt-6 md:pt-8 px-6 md:px-8 pb-3 md:pb-4 bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-stone-100">
                    <h2 className="text-[#FF3B30] font-semibold text-[10px] md:text-sm uppercase tracking-widest mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h2>
                    <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Today</h1>
                </div>

                <div className={`relative flex-1 px-4 md:px-6 py-4 space-y-2 ${needsScroll ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'}`} ref={containerRef}>
                    {events.map((event, idx) => {
                        const isActive = activeEventIndex === idx;
                        return (
                            <div 
                                id={`event-${idx}`}
                                key={event.id}
                                onClick={() => setActiveEventIndex(idx)}
                                className={`relative flex items-center p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.1)]
                                    ${isActive ? 'bg-[#F2F1F6] scale-[1.02] shadow-sm' : 'bg-transparent hover:bg-stone-50'}
                                `}
                            >
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-8 md:h-10 rounded-full transition-colors duration-300 ${event.color}`}></div>
                                
                                <div className="flex-1 pl-3 md:pl-4 pr-2">
                                    <div className={`text-sm md:text-base font-semibold tracking-tight transition-colors duration-300 ${isActive ? 'text-black' : 'text-stone-700'}`}>
                                        {event.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-stone-500 mt-1 md:mt-1 font-normal">
                                        <event.Icon className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-60" />
                                        {event.location}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`text-xs md:text-sm font-semibold font-mono ${isActive ? 'text-black' : 'text-stone-500'}`}>
                                        {event.startTime.split(' ')[0]}
                                    </div>
                                    <div className="text-[9px] md:text-[10px] font-semibold tracking-widest text-stone-400">
                                        {event.startTime.split(' ')[1]}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             <div className="flex-1 relative overflow-hidden min-w-0">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
                    <div 
                        className="h-full bg-[#f2663b] shadow-[0_0_10px_rgba(242,102,59,0.8)]"
                        style={{ width: `${((activeEventIndex + 1) / events.length) * 100}%`, transition: 'width 0.5s ease-out' }}
                    ></div>
                 </div>

                 <div className="relative w-full h-full overflow-hidden group">
                     {events.map((evt, idx) => {
                         const isActive = activeEventIndex === idx;
                         return (
                             <div 
                                 key={evt.id}
                                 className={`absolute inset-0 w-full h-full origin-center transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'}`}
                             >
                                 {/* 媒体渲染区域：直接铺满 */}
                                 {evt.videoUrl ? (
                                     <video 
                                        autoPlay 
                                        muted 
                                        loop 
                                        playsInline 
                                        poster={evt.poster}
                                        className="absolute inset-0 w-full h-full object-cover"
                                     >
                                         <source src={evt.videoUrl} type="video/mp4" />
                                     </video>
                                 ) : evt.imageUrl ? (
                                     <img src={evt.imageUrl} alt={evt.title} className="absolute inset-0 w-full h-full object-cover" />
                                 ) : (
                                     <div className="absolute inset-0 w-full h-full bg-stone-200 flex items-center justify-center">
                                         <evt.Icon className="w-16 h-16 md:w-20 md:h-20 text-stone-400 opacity-30" />
                                     </div>
                                 )}
                             </div>
                         );
                     })}

                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none opacity-80 z-20"></div>

                     <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 z-20 ${activeEvent.id === 'bedtime' ? 'bg-black/60' : 'bg-transparent'}`}></div>

                     <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8 z-30 pointer-events-none">
                         <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-2 drop-shadow-md transition-all duration-500">
                             {activeEvent.title}
                         </h3>
                         <div className="flex items-center gap-2 text-white/90 text-[10px] md:text-sm font-medium drop-shadow-md">
                             <span className="font-mono bg-black/30 backdrop-blur-md px-2 py-0.5 rounded uppercase tracking-widest">{activeEvent.startTime}</span>
                             <span>·</span>
                             <span className="flex items-center gap-1.5 opacity-90"><activeEvent.Icon className="w-3 h-3 md:w-3.5 md:h-3.5"/> {activeEvent.location}</span>
                         </div>
                     </div>
                 </div>
             </div>
          </div>

        </div>
      </RevealOnScroll>
    </section>
  );
};

export default FamilyCalendarSection;
