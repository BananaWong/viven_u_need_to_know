import React, { useEffect, useRef, useState } from 'react';
import { Label, RevealOnScroll } from '../Common/UI';
import Icons from '../Icons';
import { MARKET_COMPARISON_DATA } from '../../constants/data.jsx';

const COMPETITORS = [
    { id: 'ro', label: 'RO System' },
    { id: 'pitcherFridge', label: 'Pitcher' },
    { id: 'wholeHome', label: 'Whole Home' },
    { id: 'bottled', label: 'Bottled' },
    { id: 'tap', label: 'Tap Water' }
];

const renderValue = (val) => {
    if (val === 'NO' || val === 'NONE') return <Icons.Close className="w-5 h-5 md:w-5 md:h-5 text-black mx-auto" strokeWidth={2.5} />;
    if (val === 'YES') return <Icons.Check className="w-5 h-5 md:w-5 md:h-5 text-black mx-auto" strokeWidth={2.5} />;
    if (val === 'PARTIAL') return <Icons.Check className="w-5 h-5 md:w-5 md:h-5 text-black mx-auto" strokeWidth={2.5} />;
    if (val === '-') return <span className="text-black font-medium text-xl mx-auto leading-none">-</span>;
    if (val === '0%') return <Icons.Check className="w-5 h-5 md:w-5 md:h-5 text-black mx-auto" strokeWidth={2.5} />;
    return <Icons.Close className="w-5 h-5 md:w-5 md:h-5 text-black mx-auto" strokeWidth={2.5} />;
};

const renderVivenValue = () => {
    return (
        <div className="flex items-center justify-center text-[#f2663b] scale-110">
            <Icons.Check className="w-5 h-5" strokeWidth={5.5} />
        </div>
    );
};

// PC Matrix Row (Original)
const MatrixRowPC = ({ label, tap, pitcherFridge, bottled, wholeHome, ro, isLast }) => {
    return (
        <div className={`matrix-row-pc grid grid-cols-[2.2fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-stone-100/50 text-[14px] font-medium min-w-[1000px] hover:bg-stone-50/50 transition-colors group ${isLast ? 'border-b-0' : ''}`}>
            <div className="py-4 px-6 text-[#2A2422] font-bold sticky left-0 z-10 bg-white group-hover:bg-stone-50/50 transition-colors flex items-center whitespace-pre-line leading-snug text-[16px] md:text-[17px] border-r border-stone-100/30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                {label}
            </div>
            <div className="viven-highlight py-4 px-1 text-center bg-[#FFF7ED]/30 flex items-center justify-center transition-colors">
                {renderVivenValue()}
            </div>
            <div className="py-4 px-1 text-center flex items-center justify-center">{renderValue(tap)}</div>
            <div className="py-4 px-1 text-center flex items-center justify-center">{renderValue(pitcherFridge)}</div>
            <div className="py-4 px-1 text-center flex items-center justify-center">{renderValue(bottled)}</div>
            <div className="py-4 px-1 text-center flex items-center justify-center">{renderValue(wholeHome)}</div>
            <div className="py-4 px-1 text-center flex items-center justify-center">{renderValue(ro)}</div>
        </div>
    );
};

// Mobile Matrix Row (1 vs 1)
const MatrixRowMobile = ({ label, competitorValue, isLast }) => {
    return (
        <div className={`matrix-row-mobile grid grid-cols-12 border-b border-stone-100/50 text-[12px] sm:text-[13px] font-medium w-full ${isLast ? 'border-b-0' : ''}`}>
            <div className="col-span-6 py-3 px-3 text-[#2A2422] font-bold flex items-center whitespace-pre-line leading-snug break-words hyphens-auto">
                {label}
            </div>
            <div className="col-span-3 py-3 px-1 text-center bg-[#FFF7ED]/30 flex items-center justify-center border-x border-[#f2663b]/10">
                {renderVivenValue()}
            </div>
            <div className="col-span-3 py-3 px-1 text-center flex items-center justify-center">
                <div className="mobile-competitor-val">
                    {renderValue(competitorValue)}
                </div>
            </div>
        </div>
    );
};

const TechnologySection = () => {
    const sectionRef = useRef(null);
    const [activeCompetitor, setActiveCompetitor] = useState('ro');

    useEffect(() => {
        if (!window.gsap) return;
        const ctx = window.gsap.context(() => {
            const tl = window.gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 75%'
                }
            });

            tl.fromTo('.matrix-header-text', 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power3.out' }
            );
            tl.fromTo('.matrix-container', 
                { y: 40, opacity: 0, scale: 0.98 }, 
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 
                "-=0.3"
            );
            
            // PC animations
            tl.fromTo('.matrix-row-pc', 
                { x: -20, opacity: 0 }, 
                { x: 0, opacity: 1, stagger: 0.03, duration: 0.4, ease: 'power2.out' }, 
                "-=0.4"
            );
            
            // Mobile animations
            tl.fromTo('.matrix-row-mobile', 
                { y: 15, opacity: 0 }, 
                { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' }, 
                "-=0.4"
            );

            tl.fromTo('.viven-highlight', 
                { scale: 0.9, opacity: 0, backgroundColor: 'rgba(255,247,237, 0)' }, 
                { scale: 1, opacity: 1, stagger: 0.03, duration: 0.4, ease: 'back.out(1.5)', backgroundColor: '' }, 
                "-=0.5"
            );

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    // Animate mobile competitor column changes
    useEffect(() => {
        if (!window.gsap) return;
        window.gsap.fromTo('.mobile-competitor-val', 
            { opacity: 0, scale: 0.8 }, 
            { opacity: 1, scale: 1, duration: 0.3, stagger: 0.02, ease: 'power2.out', overwrite: 'auto' }
        );
    }, [activeCompetitor]);

    return (
        <section id="solution" className="py-24 lg:py-32 bg-white relative z-10" ref={sectionRef}>
            <div className="max-w-[1200px] mx-auto px-4 md:px-12 relative z-10">
                 <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
                     <div className="matrix-header-text"><Label className="text-[#f2663b]">PURE PEACE OF MIND</Label></div>
                     <h2 className="matrix-header-text text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-[1.05]">Clean, functional, refined water.<br />Done easy.</h2>
                 </div>
                 {/* Mobile Competitor Switcher Tabs */}
                 <div className="md:hidden relative mb-6">
                    <div className="matrix-container w-full overflow-x-auto custom-scrollbar flex items-center gap-2 pb-2 px-1 snap-x">
                        {COMPETITORS.map(comp => (
                            <button
                                key={comp.id}
                                onClick={() => setActiveCompetitor(comp.id)}
                                className={`whitespace-nowrap px-4 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 border snap-start ${
                                    activeCompetitor === comp.id 
                                    ? 'bg-stone-900 text-white border-stone-900 shadow-lg scale-105' 
                                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                                }`}
                            >
                                {comp.label}
                            </button>
                        ))}
                    </div>
                    {/* Gradient Fade for scroll hint */}
                    <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                 </div>

                 <div className="matrix-container bg-white border border-stone-200 rounded-[1.25rem] md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-stone-200/50 overflow-hidden relative">
                     
                     {/* --- PC VIEW --- */}
                     <div className="hidden md:block overflow-x-auto custom-scrollbar relative z-10">
                         <div className="min-w-[1000px]">
                             <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-stone-200 text-[14px] lg:text-[15px] uppercase tracking-widest text-stone-500 font-bold bg-stone-50/80 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.02)]">
                                 <div className="py-6 px-6 sticky left-0 z-10 bg-stone-50/90 backdrop-blur-md flex items-center border-r border-stone-200/50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">Feature</div>
                                 <div className="viven-highlight py-6 px-2 text-center text-[#f2663b] font-bold tracking-[0.2em] bg-[#FFF7ED]/80 flex items-center justify-center text-[17px] shadow-[inset_0_-2px_6px_rgba(242,102,59,0.05)]">Viven</div>
                                 <div className="py-6 px-2 text-center flex items-center justify-center">Tap</div>
                                 <div className="py-6 px-2 text-center flex items-center justify-center whitespace-pre-line leading-tight text-[12px] xl:text-[13px]">Pitcher /{"\n"}Fridge</div>
                                 <div className="py-6 px-2 text-center flex items-center justify-center">Bottled</div>
                                 <div className="py-6 px-2 text-center flex items-center justify-center whitespace-pre-line leading-tight text-[12px] xl:text-[13px]">Whole{"\n"}Home</div>
                                 <div className="py-6 px-2 text-center flex items-center justify-center whitespace-pre-line leading-tight text-[12px] xl:text-[13px]">RO{"\n"}System</div>
                             </div>
                             
                             {MARKET_COMPARISON_DATA.map((row, index) => (
                                 <MatrixRowPC key={index} {...row} isLast={index === MARKET_COMPARISON_DATA.length - 1} />
                             ))}
                         </div>
                     </div>

                     {/* --- MOBILE VIEW (1 vs 1) --- */}
                     <div className="block md:hidden relative z-10">
                         <div className="grid grid-cols-12 border-b border-stone-200 text-[11px] uppercase tracking-widest text-stone-500 font-bold bg-stone-50/80 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.02)]">
                             <div className="col-span-6 py-4 px-3 flex items-center">Feature</div>
                             <div className="viven-highlight col-span-3 py-4 px-1 text-center text-[#f2663b] font-bold tracking-[0.2em] bg-[#FFF7ED]/80 flex items-center justify-center border-x border-[#f2663b]/10 shadow-[inset_0_-2px_6px_rgba(242,102,59,0.05)]">Viven</div>
                             <div className="col-span-3 py-4 px-2 text-center flex items-center justify-center text-[#2A2422] leading-tight break-words">
                                 {COMPETITORS.find(c => c.id === activeCompetitor)?.label.replace(' ', '\n')}
                             </div>
                         </div>
                         
                         {MARKET_COMPARISON_DATA.map((row, index) => (
                             <div key={index} className="mobile-competitor-val">
                                 <MatrixRowMobile 
                                     label={row.label} 
                                     viven={row.viven} 
                                     competitorValue={row[activeCompetitor]} 
                                     isLast={index === MARKET_COMPARISON_DATA.length - 1} 
                                 />
                             </div>
                         ))}
                     </div>

                 </div>
            </div>
        </section>
    );
};

export default TechnologySection;
