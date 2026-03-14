import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Label, RevealOnScroll, Button } from '../Common/UI';
import Icons from '../Icons';

const AnatomyFeature = ({ icon, title, desc, align = 'left', className = '' }) => {
    const isRightAligned = align === 'right';
    const iconBg = 'bg-stone-100';
    const iconColor = 'text-stone-500';
    const textClass = isRightAligned ? 'anatomy-text-left' : 'anatomy-text-right';

    return (
        <div className={`anatomy-feature-item flex items-start gap-4 md:gap-5 py-1 md:p-4 rounded-2xl border border-transparent w-full max-w-[480px] cursor-default ${isRightAligned ? 'flex-row lg:flex-row-reverse text-left lg:text-right mr-auto lg:mr-0 lg:ml-auto' : 'flex-row text-left mr-auto'} ${textClass} ${className}`}>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor} [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 transition-transform duration-500`}>
                {icon}
            </div>
            <div className="flex flex-col flex-1 mt-1 md:mt-1">
                <h4 className="text-base md:text-[17px] font-semibold uppercase tracking-tight mb-1 md:mb-1.5 text-stone-800 leading-[1.3] lg:whitespace-nowrap">{title}</h4>
                <p className="text-xs md:text-sm font-medium text-stone-500/90 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
};
const ProductAnatomySection = () => {
    const sectionRef = useRef(null);
    const imageRef = useRef(null); 
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;
            videoRef.current.play().catch(err => {
                console.warn("Video autoplay blocked or failed:", err);
            });
        }
    }, []);

    useEffect(() => {
        if (!window.gsap) return;
        const ctx = window.gsap.context(() => {
            const tl = window.gsap.timeline({
                scrollTrigger: {
                    trigger: '.anatomy-grid',
                    start: 'top 65%'
                }
            });

            tl.fromTo(imageRef.current, 
                { y: 100, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 
                0
            );

            if (window.innerWidth >= 1024) {
                // Desktop: Slide in from the sides towards the center image
                tl.fromTo('.anatomy-text-left', 
                    { x: 25, opacity: 0 },
                    { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }, 
                    0.15
                );
                
                tl.fromTo('.anatomy-text-right', 
                    { x: -25, opacity: 0 },
                    { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }, 
                    0.15
                );
            } else {
                // Mobile: Stacked sequentially under the image, sliding in from left
                tl.fromTo('.anatomy-feature-item', 
                    { x: -30, opacity: 0 },
                    { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power3.out" }, 
                    0.15
                );
            }

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="product-hub" className="py-24 lg:py-32 bg-[#FCFBF9] overflow-hidden" ref={sectionRef}>
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                
                <div className="relative max-w-[1200px] mx-auto mb-10 md:mb-14 px-4 md:px-0 mt-8 md:mt-0">
                    <div className="text-center mb-4 md:mb-6">
                        <Label className="text-[#f2663b] flex items-center justify-center gap-2 mb-3 font-bold uppercase tracking-[0.1em]">
                            Viven protects and enhances your health
                        </Label>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-[1.1] md:leading-[1.05]">
                            High flow rates, no more waiting. {' '}
                            <span className="relative inline-block group cursor-help underline decoration-stone-300 underline-offset-[6px] hover:decoration-[#f2663b] transition-colors">
                                Molecular Hydrogen
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 sm:w-80 p-4 bg-white border border-stone-200 text-sm text-stone-600 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 text-center shadow-xl font-sans font-normal normal-case tracking-normal leading-relaxed translate-y-1 group-hover:translate-y-0">
                                    Natural supplement, primarily used for fighting oxidative stress and regulating oxidants. 
                                    <br />
                                    <Link to="/science" className="text-[#f2663b] font-semibold hover:underline mt-2 inline-block">Read more in our Science page.</Link>
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white drop-shadow-[0_1px_0_rgba(0,0,0,0.05)]"></span>
                                </span>
                            </span>
                        </h2>
                        </div>

                        <div className="max-w-4xl mx-auto mb-10 md:mb-12 space-y-1 md:space-y-1 px-6 text-center text-balance">
                            <p className="text-lg md:text-xl text-stone-600 font-medium leading-tight max-w-2xl mx-auto">
                                3X RO’s flow rate means you fill your cups, bottles, and pots quickly.
                            </p>
                            <p className="text-lg md:text-xl text-stone-600 font-medium leading-tight max-w-3xl mx-auto">
                                No waiting for clean water after emptying your pitcher or RO tank. 
                                <span className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-[#2A2422] leading-[1.1] mt-3 block">
                                    With Viven, you don’t need to manage your filtered water anymore.
                                </span>
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto rounded-[2rem] md:rounded-[2.5rem] overflow-hidden safari-rounded-fix shadow-2xl relative border border-stone-200/50">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-auto block"
                        >
                            <source src="https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto/v1771687911/Video_Project_7_cye3pk.mp4" type="video/mp4" />
                        </video>
                        {/* NSF Logo Overlay */}
                        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20">
                            <img
                                src="https://res.cloudinary.com/dsyxtnpgm/image/upload/v1771587494/NSF_International_logo.svg_1_srmspw.webp"
                                alt="NSF Certified"
                                className="h-8 md:h-12 w-auto object-contain grayscale opacity-80 mix-blend-screen transition-all duration-500"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    </div>
                </div>

                <RevealOnScroll className="text-center mt-20 md:mt-32 mb-8 md:mb-12">
                    <Label className="text-[#f2663b] font-bold tracking-[0.15em] mb-3">Designed by Product Experts</Label>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-[1.1] max-w-4xl mx-auto text-balance">
                        From Apple, Kohler, and Instant Pot, who are obsessed with water and health.
                    </h2>
                </RevealOnScroll>

                <div className="anatomy-grid max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(360px,520px)_1fr] gap-x-4 lg:gap-x-12 xl:gap-x-16 gap-y-8 lg:gap-y-0 items-center relative">
                    {/* Left Column */}
                    <div className="flex flex-col justify-center gap-y-8 lg:gap-y-12 h-full order-2 lg:order-1">
                        <AnatomyFeature align="right" icon={<Icons.Shield />} title="ELIMINATES TOXINS & PLASTICS." desc="Rigorously tested filtration system that exceeds NSF standards." />
                        <AnatomyFeature align="right" icon={<Icons.Zap />} title="ADDS ESSENTIAL MINERALS." desc="Electrolytes enable your body to absorb water." />
                        <AnatomyFeature align="right" icon={<Icons.Beaker />} title="FIGHTS OXIDATIVE STRESS." desc="Our body naturally produces hydrogen if we eat a lot of fiber. Most of us don’t" />
                        <AnatomyFeature align="right" icon={<Icons.Box />} title="ZERO PLASTIC LEACHING." desc="Construction featuring food-grade internals to guarantee purity." />
                    </div>

                    {/* Central Image with Conservative Aspect Ratio to trim just a bit of top/bottom */}
                    <div className="flex flex-col items-center justify-center relative order-1 lg:order-2 py-2 anatomy-hardware w-full max-w-[480px] md:max-w-[640px] mx-auto">
                        <div className="w-full aspect-[0.78/1] md:aspect-[0.85/1] lg:aspect-[0.88/1] relative z-10 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-stone-200/50 bg-stone-50" ref={imageRef}>
                            <img
                                src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1772179854/Generated_Image_February_27_2026_-_4_03PM_gftqpo.webp"
                                alt="Viven Unified System"
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col justify-center gap-y-8 lg:gap-y-12 h-full order-3 lg:order-3">
                        <AnatomyFeature align="left" icon={<Icons.Waves />} title="INSTANT WATER. NO WAITING." desc="High flow technology that matches your kitchen workflow." />
                        <AnatomyFeature align="left" icon={<Icons.Clock />} title="5-MINUTE TOP-DOWN SETUP." desc="Patented system installs from above the sink. No plumber needed." />
                        <AnatomyFeature align="left" icon={<Icons.Refresh />} title="100% EFFICIENT. ZERO WASTE." desc="Unlike RO systems, Viven preserves every single drop of water." />
                        <AnatomyFeature align="left" icon={<Icons.Smartphone />} title="REAL-TIME APP TRACKING." desc="Smart app monitoring for filter life and automated reordering." />
                    </div>
                </div>

                <div className="mt-6 md:mt-10 flex flex-col items-center justify-center px-4">
                    <a href="#reserve" className="shrink-0">
                        <Button variant="primary" className="h-12 md:h-14 px-10 md:px-12 text-xs md:text-sm">
                            Reserve the Kitchen Faucet+
                        </Button>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default ProductAnatomySection;
