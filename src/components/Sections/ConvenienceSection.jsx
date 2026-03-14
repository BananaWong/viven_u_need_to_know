import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label, RevealOnScroll } from '../Common/UI';
import Icons from '../Icons';

const ConvenienceSection = () => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    const getPos = useCallback((e) => {
        if (!containerRef.current) return 50;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
        return Math.min(Math.max(((x - rect.left) / rect.width) * 100, 0), 100);
    }, []);

    useEffect(() => {
        const handleMove = (e) => {
            if (!isDragging.current) return;
            setSliderPos(getPos(e));
        };
        const handleEnd = () => { isDragging.current = false; };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: true });
        window.addEventListener('touchend', handleEnd);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [getPos]);

    return (
        <section id="convenience" className="py-24 md:py-32 bg-[#FCFBF9] relative overflow-hidden border-t border-stone-100">
            <RevealOnScroll>
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20">
                    <div className="w-full text-center md:text-left">
                        <Label className="text-[#f2663b]">Streamlined Routine</Label>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter mb-4 md:mb-6 text-[#2A2422] leading-[1.05]">Replace 5 products with 1 faucet.</h2>
                        <p className="text-sm md:text-base text-stone-500 font-normal leading-relaxed max-w-2xl mx-auto md:mx-0">
                            Eliminate the countertop clutter, the pitcher refills, and the expensive single-use hydrogen bottles.
                        </p>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-stone-200 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden cursor-ew-resize shadow-[0_20px_60px_rgba(0,0,0,0.06)] border-[4px] md:border-[6px] border-white ring-1 ring-stone-900/5 select-none touch-pan-y"
                    onMouseDown={(e) => { isDragging.current = true; setSliderPos(getPos(e)); }}
                    onTouchStart={(e) => { isDragging.current = true; setSliderPos(getPos(e)); }}
                >
                    <div className="absolute inset-0">
                        <img
                            src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1770971810/back1_cvwuyn.webp"
                            alt="Cluttered Counter"
                            className="w-full h-full object-cover object-center grayscale-[30%] sepia-[10%] pointer-events-none select-none"
                            draggable="false"
                        />
                        <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-[#2A2422]/80 text-white px-3 md:px-5 py-1.5 md:py-2.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20">
                            Before: Clutter
                        </div>
                    </div>

                    <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                        <img
                            src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1770971814/%E5%9B%BE%E7%89%87_20260213161757_12_54_ahsau9.jpg"
                            alt="Clean Viven Counter"
                            className="w-full h-full object-cover object-center pointer-events-none select-none"
                            draggable="false"
                        />
                        <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-white/90 text-[#f2663b] px-3 md:px-5 py-1.5 md:py-2.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md shadow-sm border border-white">
                            After: Viven Only
                        </div>
                    </div>

                    <div
                        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_20px_rgba(0,0,0,0.25)] pointer-events-none"
                        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                    />

                    <div
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${sliderPos}%` }}
                    >
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-[#f2663b] border border-stone-100">
                            <Icons.ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
                    <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-stone-100">
                        <h4 className="text-red-400 font-semibold text-xs md:text-sm uppercase tracking-wide mb-6 md:mb-8 flex items-center gap-3">
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-50 flex items-center justify-center"><Icons.Close className="w-3 h-3 md:w-4 md:h-4" /></span> 
                            What You Replace
                        </h4>
                        <ul className="space-y-4 md:space-y-6 text-sm text-stone-500 font-normal leading-relaxed">
                            <li className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-stone-300 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <strong className="block text-[#2A2422] font-semibold mb-1 tracking-tight">Gravity-Fed Pitchers</strong>
                                    Inefficient filtration speed and frequent manual maintenance.
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-stone-300 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <strong className="block text-[#2A2422] font-semibold mb-1 tracking-tight">Traditional RO Systems</strong>
                                    Complex installation with significant water wastewater (4:1 ratio).
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-stone-300 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <strong className="block text-[#2A2422] font-semibold mb-1 tracking-tight">Single-Use Hydrogen Devices</strong>
                                    High recurring costs and countertop clutter.
                                </div>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#9d3423] to-[#f2663b] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_40px_rgba(242,102,59,0.25)] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                        <h4 className="font-semibold tracking-wide text-xs md:text-sm uppercase mb-6 md:mb-8 flex items-center gap-3 relative z-10">
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center"><Icons.Check className="w-3 h-3 md:w-4 md:h-4 text-white" strokeWidth={3}/></span> 
                            What You Get
                        </h4>
                        <ul className="space-y-4 md:space-y-6 text-sm text-white/80 font-normal relative z-10 leading-relaxed">
                            <li className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <strong className="block text-white font-semibold mb-1 tracking-tight">Integrated Architectural Fixture</strong>
                                    Minimalist design unifying all functions into one tap.
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <strong className="block text-white font-semibold mb-1 tracking-tight">Zero-Footprint Integration</strong>
                                    Eliminates all countertop filtration devices.
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <strong className="block text-white font-semibold mb-1 tracking-tight">Instant Mineralization</strong>
                                    On-demand delivery of biologically optimized water.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            </RevealOnScroll>
        </section>
    );
};

export default ConvenienceSection;
