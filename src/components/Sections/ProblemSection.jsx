import React, { useRef, useState } from 'react';
import { useGSAP } from '../../hooks/useGSAP';
import { Label, RevealOnScroll } from '../Common/UI';
import { SYMMETRICAL_RISK_DATA } from '../../constants/data.jsx';

const SymmetricalRiskAnalysis = () => {
    const containerRef = useRef(null);
    const dropImageRefPC = useRef(null);
    const textContainerRefPC = useRef(null);
    const scrollRef = useRef(null);
    const [activeMobileIndex, setActiveMobileIndex] = useState(0);

    // Mathematically precise alignment with SVG curves (Path peak is at 75% for left, 25% for right)
    const leftPositions = [
        { top: '22%', left: '59.2%' },
        { top: '50%', left: '75%' },
        { top: '78%', left: '59.2%' }
    ];
    
    const rightPositions = [
        { top: '22%', left: '40.8%' },   
        { top: '50%', left: '25%' },     
        { top: '78%', left: '40.8%' }    
    ];

    useGSAP(() => {
        if (!window.gsap) return;
        const tl = window.gsap.timeline({ scrollTrigger: { trigger: containerRef.current, start: 'top 75%' } });

        tl.fromTo('.water-drop-anim', { y: -60, scaleY: 1.1, opacity: 0 }, { y: 0, scaleY: 1, opacity: 1, duration: 0.7, ease: "power3.out" }, 0);
        tl.fromTo('.jewel-curve path', { strokeDasharray: 2000, strokeDashoffset: 2000 }, { strokeDashoffset: 0, duration: 1.0, ease: "power2.inOut" }, 0.2);
        tl.fromTo('.jewel-node-dot', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, stagger: 0.05, duration: 0.4, ease: "back.out(2)" }, 0.6);
        tl.fromTo('.jewel-node-text', { y: -15, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }, 0.7);

        // Mobile specific stagger
        tl.fromTo('.mobile-risk-node', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }, 0.8);

        // Final aesthetic state (Static)
        if (window.innerWidth >= 768) {
            const isTablet = window.innerWidth < 1024;
            const xOffset = isTablet ? 30 : 60;

            tl.to(dropImageRefPC.current, { scale: 1.4, duration: 0.8, ease: "power2.out" }, 0.5);
            tl.to(textContainerRefPC.current, { opacity: 1, duration: 0.5 }, 0.7);
            tl.to('.jewel-container-left', { x: -xOffset, duration: 0.8, ease: "power2.out" }, 0.5);
            tl.to('.jewel-container-right', { x: xOffset, duration: 0.8, ease: "power2.out" }, 0.5);
        }
    }, { scope: containerRef });

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft } = scrollRef.current;
        // 140px card width + 6px gap (gap-1.5) = 146px per step
        const newIndex = Math.round(scrollLeft / 146);
        if (newIndex !== activeMobileIndex) {
            setActiveMobileIndex(newIndex);
        }
    };

    const scrollToIndex = (index) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTo({
            left: index * 146,
            behavior: 'smooth'
        });
    };

    const renderLabelWithSubtext = (label) => {
        if (!label.includes('(')) return label;

        // Use a more robust split that handles potential newlines inside parentheses
        const parts = label.split(/(\([\s\S]*?\))/g);
        return parts.map((part, i) => {
            if (part.startsWith('(') && part.endsWith(')')) {
                return (
                    <span key={i} className="block text-[0.9em] font-normal mt-0.5 leading-tight tracking-tight opacity-80">
                        {part}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const renderVisualNodePC = (item, idx, isLeft) => {
        const pos = isLeft ? leftPositions[idx] : rightPositions[idx];
        return (
            <div key={item.id} className="absolute pointer-events-none" style={{ top: pos.top, left: pos.left }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <div className="jewel-node-dot relative flex items-center justify-center w-4 h-4 lg:w-5 lg:h-5 shrink-0 z-10">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full border-[1.5px] bg-[#2A2422] border-[#2A2422] relative z-10"></div>
                    </div>
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-[12px] lg:right-[18px]' : 'left-[12px] lg:left-[18px]'} z-10`}>
                        <div className="jewel-node-text py-1 px-1 w-max">
                            <span className="tracking-widest lg:tracking-[0.15em] whitespace-pre-wrap block leading-tight text-[11px] lg:text-[17px] text-[#2A2422] font-semibold text-center">
                                {renderLabelWithSubtext(item.label)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full max-w-[900px] mx-auto mt-6 md:mt-10 mb-1 md:mb-2 pt-4 md:pt-8" ref={containerRef}>
            {/* Desktop View */}
            <div className="hidden md:flex relative w-full min-h-[360px] lg:min-h-[420px] items-center justify-center overflow-visible">
                <div className="absolute inset-0 m-auto w-[200px] lg:w-[260px] h-[200px] lg:h-[260px] bg-blue-100/20 rounded-full filter blur-[60px] animate-pulse pointer-events-none z-0"></div>
                <div className="jewel-container-left absolute right-[50%] mr-[100px] lg:mr-[180px] top-0 bottom-0 w-[45px] lg:w-[80px] z-10 pointer-events-none">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none jewel-curve" preserveAspectRatio="none" viewBox="0 0 80 540">
                        <path d="M 40,80 Q 80,270 40,460" fill="none" className="stroke-stone-200 stroke-[1.5px]" />
                    </svg>
                    {SYMMETRICAL_RISK_DATA.filter(d => d.side === 'left').map((item, idx) => renderVisualNodePC(item, idx, true))}
                </div>
                <div className="jewel-container-right absolute left-[50%] ml-[100px] lg:ml-[180px] top-0 bottom-0 w-[45px] lg:w-[80px] z-10 pointer-events-none">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none jewel-curve" preserveAspectRatio="none" viewBox="0 0 80 540">
                        <path d="M 40,80 Q 0,270 40,460" fill="none" className="stroke-stone-200 stroke-[1.5px]" />
                    </svg>
                    {SYMMETRICAL_RISK_DATA.filter(d => d.side === 'right').map((item, idx) => renderVisualNodePC(item, idx, false))}
                </div>
                <div className="water-drop-anim relative w-[315px] lg:w-[420px] h-[315px] lg:h-[420px] mx-auto flex flex-col items-center justify-center pointer-events-none z-20 overflow-visible">
                    <img ref={dropImageRefPC} src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1771640259/water_tulzd7.webp" alt="Pure" className="absolute m-auto inset-0 w-[75%] h-[75%] object-contain mix-blend-multiply drop-shadow-sm z-20 origin-center pointer-events-none" />
                    <div ref={textContainerRefPC} className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pt-16 opacity-0 pointer-events-none z-30">
                        <div className="absolute inset-0 m-auto w-[130px] lg:w-[170px] h-[130px] lg:h-[170px] bg-white/80 blur-[20px] rounded-full z-0"></div>
                        <div className="relative z-10 flex flex-col items-center mt-6 lg:mt-10">
                            <div className="text-3xl lg:text-4xl font-bold text-[#2A2422] mb-3 lg:mb-4 uppercase tracking-tight leading-none text-balance">Daily<br/>Exposure</div>
                            <div className="text-xs lg:text-base text-[#f2663b] font-semibold leading-snug max-w-[200px] lg:max-w-[240px] mx-auto">The water you use everyday<br/>is the water that<br/>matters the most.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View with Horizontal Snap Slider - Compact Version */}
            <div className="md:hidden flex flex-col items-center w-full overflow-visible">
                {/* The Drop (Refined Size) */}
                <div className="water-drop-anim relative w-[160px] h-[160px] flex items-center justify-center mb-4">
                    <div className="absolute inset-0 m-auto w-[140px] h-[140px] bg-blue-100/10 rounded-full filter blur-[30px] animate-pulse pointer-events-none z-0"></div>
                    <img src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1771640259/water_tulzd7.webp" alt="Detail" className="absolute inset-0 w-[80%] h-[80%] m-auto object-contain mix-blend-multiply drop-shadow-sm z-10 pointer-events-none scale-[1.1]" />
                    <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 h-full w-full pointer-events-none">
                        <div className="absolute inset-0 m-auto w-[100px] h-[100px] bg-white/90 blur-[12px] rounded-full z-0"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="text-lg font-bold text-[#2A2422] mb-1 uppercase tracking-tight leading-none">Daily<br/>Exposure</div>
                            <div className="text-[10px] text-[#f2663b] font-bold leading-tight mx-auto mt-0.5 opacity-90">The water<br/>that matters.</div>
                        </div>
                    </div>
                </div>

                {/* Horizontal Snap Slider - Compact Cards */}
                <div className="w-full relative px-0 mb-2">
                    <div 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-1.5 px-10 pb-2"
                    >
                        {SYMMETRICAL_RISK_DATA.map((item) => (
                            <div key={item.id} className="snap-center shrink-0 w-[140px] bg-white border border-stone-100 py-2.5 px-3 rounded-xl flex flex-col items-center text-center relative group">
                                <span className="font-mono text-[8px] font-bold text-[#f2663b] mb-1 tracking-[0.2em] opacity-50">{item.num}</span>
                                
                                <h4 className="text-[10px] font-bold text-[#2A2422] leading-[1.2] mb-1.5 text-center tracking-wide whitespace-pre-wrap">
                                    {renderLabelWithSubtext(item.label, true)}
                                </h4>

                                <div className="mt-auto flex flex-col w-full items-center">
                                    <span className="text-[8px] font-bold text-red-500/70 uppercase tracking-widest leading-none">
                                        {item.consequence}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {/* Empty spacer for end padding */}
                        <div className="shrink-0 w-8"></div>
                    </div>
                </div>

                {/* Interactive Pagination Dots */}
                <div className="flex justify-center items-center gap-2 mt-2 mb-4">
                    {SYMMETRICAL_RISK_DATA.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                activeMobileIndex === i 
                                ? 'w-6 bg-[#f2663b]' 
                                : 'w-1.5 bg-stone-200 hover:bg-stone-300'
                            }`}
                            aria-label={`Go to contaminant ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProblemSection = () => {
    const sectionRef = useRef(null);

    return (
        <section id="problem" className="py-12 md:py-20 lg:py-24 w-full bg-[#FCFBF9] relative z-20" ref={sectionRef}>
            <div className="max-w-[1440px] mx-auto w-full px-4 md:px-12 text-center text-balance">
                <RevealOnScroll>
                    <Label className="text-[#f2663b] font-bold mb-2 md:mb-2 px-2 md:px-4 text-balance mx-auto block max-w-lg md:max-w-none">The water problem is chronic exposure to modern contaminants</Label>
                    <h2 className="text-[22px] md:text-3xl lg:text-4xl font-semibold tracking-tighter max-w-5xl mx-auto mb-4 md:mb-2 leading-[1.15] text-[#2A2422] px-1 md:px-0 text-balance">
                        Even trace amounts are linked to cancer, infertility, impaired development in children, and poor metabolic health.
                    </h2>
                </RevealOnScroll>

                <SymmetricalRiskAnalysis />

                <RevealOnScroll className="mt-4 md:mt-4">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-[#2A2422] max-w-5xl mx-auto leading-[1.2] px-4 md:px-0 text-balance">
                        Viven filters what shouldn’t be there—at the faucet you use most.
                    </h3>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default ProblemSection;