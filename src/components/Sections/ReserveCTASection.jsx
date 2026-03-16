import React, { useEffect } from 'react';
import { RevealOnScroll, Button } from '../Common/UI';
import Icons from '../Icons';

const ReserveCTASection = () => {
    useEffect(() => {
        if (!window.gsap || !window.SplitType) return;
        const split = new window.SplitType('#footer-headline', { types: 'words' });
        window.gsap.from(split.words, {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '#footer-headline',
                start: 'top 90%'
            }
        });

        window.gsap.fromTo('.footer-benefit-item', 
            { opacity: 0, x: -20 },
            {
                opacity: 1,
                x: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.footer-benefits-list',
                    start: 'top 95%'
                }
            }
        );

        window.gsap.fromTo('.footer-spec-item', 
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                stagger: 0.15,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.footer-spec-grid',
                    start: 'top 95%'
                }
            }
        );
    }, []);

    const benefits = [
        <><strong>Clean water</strong>, NSF certified</>,
        <><strong>Electrolytes</strong> and <strong>minerals</strong> automatically added</>,
        <><strong>Hydrogen water</strong> available at the press of a button</>,
        <><strong>Renter-friendly</strong>: 5-minute, 1-tool installation</>
    ];

    const handleReserveClick = (e) => {
        e.preventDefault();
        if (window.fbq) {
            window.fbq('track', 'InitiateCheckout', {
                value: 50,
                currency: 'USD'
            });
        }
        window.location.href = 'https://buy.stripe.com/9B6dR978Fem9byOe5824003';
    };

    return (
        <section id="reserve" className="bg-[#F5F5F7] py-24 md:py-32 border-t border-stone-200 relative overflow-hidden">
            <RevealOnScroll>
                <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col items-center text-center">

                    {/* 2-Column Hero Area - Using items-stretch for vertical alignment */}
                    <div className="flex flex-col md:flex-row items-stretch justify-between w-full max-w-5xl mx-auto mb-16 md:mb-20 gap-12 md:gap-8 text-left">
                        
                        {/* Left Column: Content + Aligned CTA */}
                        <div className="flex flex-col md:w-1/2 shrink-0">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                <h2 id="footer-headline" className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-[#2A2422] leading-[1.1] mb-6 md:mb-10">
                                    Protect your health with our All-in-One Wellness Faucet
                                </h2>

                                {/* Mobile-only Image */}
                                <div className="block md:hidden w-full max-w-[320px] h-[360px] relative flex justify-center shrink-0 mb-8 mt-2">
                                    <img 
                                        src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1772610478/product_qu6sev.webp" 
                                        alt="Viven Faucet" 
                                        className="w-full h-full object-contain object-center mix-blend-multiply opacity-95 drop-shadow-2xl scale-110"
                                    />
                                    
                                    {/* Mobile Swallowtail Ribbon - Refined Mini Version */}
                                    <div className="absolute top-1 -right-2 z-30 pointer-events-none rotate-[5deg]">
                                        <div className="relative bg-[#1C1917] text-white w-fit min-w-[60px] px-2.5 pt-3 pb-5 flex flex-col items-center shadow-lg [clip-path:polygon(0_0,100%_0,100%_100%,50%_88%,0_100%)] border-x border-white/10">
                                            {/* Inner "Stitch" Line */}
                                            <div className="absolute inset-x-0.5 inset-y-0 border-x border-white/5 pointer-events-none"></div>
                                            
                                            <div className="flex flex-col items-center leading-none">
                                                <span className="text-[8px] font-bold mb-0.5 text-[#f2663b]">SAVE</span>
                                                <span className="text-base font-bold tracking-tighter text-white">$200</span>
                                            </div>
                                            <div className="mt-1.5 py-0.5 px-1 border-y border-white/20 w-full flex justify-center">
                                                <span className="text-[7px] font-bold uppercase tracking-tight whitespace-nowrap">Limited Access</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Benefits List */}
                                <div className="footer-benefits-list flex flex-col gap-3 mb-10 md:mb-12">
                                    {benefits.map((benefit, idx) => (
                                        <div key={idx} className="footer-benefit-item flex items-center gap-3 opacity-0">
                                            <div className="w-5 h-5 rounded-full bg-[#f2663b]/10 flex items-center justify-center shrink-0">
                                                <Icons.Check className="w-3 h-3 text-[#f2663b]" strokeWidth={4} />
                                            </div>
                                            <span className="text-base md:text-lg font-semibold text-stone-700 tracking-tight text-left">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* FOMO Progress Bar */}
                                <div className="w-full max-w-sm md:max-w-md mb-8 md:mb-10 text-left">
                                    <div className="flex justify-between text-xs md:text-sm font-mono uppercase tracking-widest font-bold mb-2 md:mb-3 text-[#2A2422]">
                                        <span>Production Capacity</span>
                                        <span className="text-[#f2663b]">30% Reserved</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#f2663b] w-[30%] relative rounded-full">
                                             <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] md:text-xs text-stone-500 mt-3 md:mt-4 font-medium uppercase tracking-widest">
                                        Only ~1400 units remaining for 2026 delivery.
                                    </p>
                                </div>                            </div>

                            {/* Central CTA - Push to bottom */}
                            <div className="mt-auto flex flex-col items-center md:items-start w-full">
                                <a href="https://buy.stripe.com/9B6dR978Fem9byOe5824003" onClick={handleReserveClick} className="inline-block w-full sm:w-auto">
                                    <Button variant="primary" className="h-14 md:h-16 px-10 md:px-14 text-xs md:text-sm font-semibold mb-4 shadow-xl hover:shadow-2xl shadow-[#f2663b]/20 w-full sm:w-auto hover:-translate-y-0.5 transition-all">
                                        Reserve Now for $50
                                    </Button>
                                </a>
                                <div className="text-[12px] md:text-xs text-stone-700 font-semibold font-mono uppercase tracking-widest flex flex-col md:flex-row items-center justify-center md:justify-start w-full mt-3 gap-1.5 md:gap-3">
                                    <span>100% Fully Refundable</span>
                                    <span className="text-[#f2663b] hidden md:inline">•</span>
                                    <span>One-time Reservation Fee</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Image + Medal Ribbon - Centered vertically with content */}
                        <div className="hidden md:flex flex-col md:w-1/2 items-center justify-center self-center shrink-0 pt-10 md:pt-20">
                            <div className="relative group w-full max-w-[420px] lg:max-w-[480px]">
                                <img 
                                    src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1772610478/product_qu6sev.webp" 
                                    alt="Viven Faucet" 
                                    className="w-full h-auto object-contain object-center mix-blend-multiply opacity-95 drop-shadow-2xl scale-125 transition-transform duration-700 hover:scale-[1.28]"
                                />
                                
                                {/* Monochrome Medal Ribbon (Swallowtail Banner) */}
                                <div className="absolute top-0 -right-8 lg:-right-12 z-30 pointer-events-none rotate-[5deg]">
                                    <div className="relative bg-[#1C1917] text-white w-fit min-w-[85px] lg:min-w-[100px] px-3 lg:px-4 pt-5 pb-7 flex flex-col items-center shadow-2xl [clip-path:polygon(0_0,100%_0,100%_100%,50%_88%,0_100%)] border-x border-white/10">
                                        {/* Inner "Stitch" Line for premium feel */}
                                        <div className="absolute inset-x-1 inset-y-0 border-x border-white/5 pointer-events-none"></div>

                                        <div className="flex flex-col items-center leading-none">
                                            <span className="text-[10px] lg:text-[11px] font-bold mb-0.5 text-[#f2663b]">SAVE</span>
                                            <span className="text-xl lg:text-2xl font-bold tracking-tighter text-white">$200</span>
                                        </div>
                                        <div className="mt-3 py-1 px-2 border-y border-white/20 w-full flex justify-center">
                                            <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">Limited Access</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* High-End Offer Grid (Apple-style Specs) */}
                    <div className="footer-spec-grid grid grid-cols-3 gap-x-1 sm:gap-x-4 w-full max-w-5xl mx-auto pt-4 md:pt-8 border-t border-stone-200/60">
                       <div className="footer-spec-item flex flex-col items-center text-center px-1">
                           <div className="min-h-[32px] md:min-h-[40px] flex items-center justify-center mb-2">
                               <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-[#f2663b] leading-tight">Limited<br/>Access</span>
                           </div>
                           <span className="text-[1.2rem] md:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-none mb-1 md:mb-2">First 1000</span>
                           <span className="text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-wide">Buyers Only</span>
                       </div>
                       
                       <div className="footer-spec-item flex flex-col items-center text-center border-l border-stone-200 px-1 pl-1 sm:pl-4">
                           <div className="min-h-[32px] md:min-h-[40px] flex items-center justify-center mb-2">
                               <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-[#f2663b] leading-tight text-center">Early-Bird<br/>Price</span>
                           </div>
                           <span className="text-[1.2rem] md:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-none mb-1 md:mb-2">$899</span>
                           <span className="text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-wide line-through opacity-60">$1,099 MSRP</span>
                       </div>

                       <div className="footer-spec-item flex flex-col items-center text-center border-l border-stone-200 px-1 pl-1 sm:pl-4">
                           <div className="min-h-[32px] md:min-h-[40px] flex items-center justify-center mb-2">
                               <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-[#f2663b] leading-tight text-center">FREE</span>
                           </div>
                           <span className="text-[1.2rem] md:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-none mb-1 md:mb-2 text-balance">Filter Set</span>
                           <span className="text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-wide text-balance">$200 Value</span>                       </div>
                    </div>

                </div>
            </RevealOnScroll>
        </section>
    );
};

export default ReserveCTASection;
