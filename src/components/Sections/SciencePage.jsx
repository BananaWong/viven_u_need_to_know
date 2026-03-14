import React, { useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Label } from '../Common/UI';
import Icons from '../Icons';

const SciencePage = () => {
    const mainRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!window.gsap) return;

        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        // Hero Text Animation
        const heroLines = mainRef.current.querySelectorAll('.hero-line');
        gsap.fromTo(heroLines, 
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.5, ease: 'expo.out', stagger: 0.1, delay: 0.2 }
        );

        // Section Content Reveal
        const sections = mainRef.current.querySelectorAll('.science-section');
        sections.forEach(section => {
            gsap.fromTo(section.querySelectorAll('.reveal-text'),
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 75%'
                    }
                }
            );
        });

        // Data Cards Stagger
        const cards = mainRef.current.querySelectorAll('.data-card');
        gsap.fromTo(cards,
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.data-grid',
                    start: 'top 80%'
                }
            }
        );

    }, []);

    const mergedBenefits = [
        { 
            title: 'Anti-Inflammatory', 
            desc: 'Reduces inflammation in the gut, joints, and throughout the body.',
            details: 'H2 selectively targets hydroxyl radicals (•OH), the most destructive ROS. Clinical data shows a significant decrease in C-reactive protein (CRP) and pro-inflammatory cytokines like IL-6.',
            stats: '-26% Cytokines',
            paper: {
                title: "Hydrogen acts as a therapeutic antioxidant by selectively reducing cytotoxic oxygen radicals",
                cite: "Ohsawa I, et al; Nature Medicine, 2007",
                doi: "10.1038/nm1577"
            }
        },
        { 
            title: 'Mitochondrial Health', 
            desc: 'Supports anti-aging, protecting DNA and mitochondrial health.',
            details: 'As the smallest molecule, H2 easily penetrates mitochondrial membranes. It enhances ATP production and stimulates the Nrf2 pathway, boosting internal antioxidant defenses.',
            stats: '+18% ATP Bio',
            paper: {
                title: "Hydrogen Water: Extra Healthy or a Hoax?—A Systematic Review of 25 Human Studies",
                cite: "Dhillon G, et al; IJMS (MDPI), 2024",
                doi: "10.3390/ijms25020973"
            }
        },
        { 
            title: 'Metabolic Support', 
            desc: 'Improves cholesterol, blood sugar, and oxidative stress markers.',
            details: '24-week clinical trials (LeBaron et al.) demonstrated that HRW significantly optimizes lipid profiles and glucose metabolism in subjects with metabolic syndrome.',
            stats: '-13.3% Cholesterol',
            paper: {
                title: "Effects of 24-Week High-Concentration Hydrogen-Rich Water on Biomarkers in Metabolic Syndrome",
                cite: "LeBaron TW, et al; Diabetes, Metab Syndr Obes, 2020",
                doi: "10.2147/DMSO.S240122"
            }
        },
        { 
            title: 'Athletic Recovery', 
            desc: 'Enhances performance by reducing muscle fatigue and soreness.',
            details: 'Research by Botek et al. proved that HRW consumption prior to exercise lowers blood lactate levels and reduces DOMS by over 30% within 24 hours.',
            stats: '-36% DOMS Rating',
            paper: {
                title: "Hydrogen Rich Water Consumption Positively Affects Muscle Performance and Alleviates DOMS",
                cite: "Botek M, et al; J Strength Cond Res, 2022",
                doi: "10.1519/JSC.0000000000003979"
            }
        }
    ];

    return (
        <div ref={mainRef} className="bg-[#FCFBF9] min-h-screen font-sans selection:bg-[#f2663b] selection:text-white antialiased overflow-x-hidden">
            <Header />
            
            <main className="relative pt-32 pb-24">
                {/* 00. Hero */}
                <section className="max-w-[1440px] mx-auto px-6 md:px-12 mb-24 md:mb-32">
                    <div className="border-b border-stone-200 pb-12">
                        <div className="max-w-5xl">
                            <div className="flex items-center gap-3 mb-6 overflow-hidden">
                                <Label className="text-[#f2663b] hero-line">Science & Innovation</Label>
                            </div>
                            <h1 className="hero-line text-6xl md:text-8xl font-semibold tracking-tight text-[#2A2422] leading-[1.05] mb-8">
                                The Science of <br/>Pure Water.
                            </h1>
                            <p className="hero-line text-2xl md:text-3xl text-stone-500 leading-relaxed max-w-4xl">
                                At Viven, we believe water shouldn’t just hydrate—it should heal, protect, and elevate your daily routine. Behind every drop that flows from our faucet is science-backed innovation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 01. Filtration */}
                <section className="science-section max-w-[1440px] mx-auto px-6 md:px-12 mb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32 items-center">
                        <div>
                            <h2 className="reveal-text text-5xl md:text-7xl font-semibold tracking-tight text-[#2A2422] leading-[1.05] mb-10">
                                Exceptional Filtration Efficiency.
                            </h2>
                            <p className="reveal-text text-2xl md:text-3xl text-stone-500 leading-relaxed mb-12">
                                Viven uses advanced multi-stage filtration to remove harmful substances and also adds electrolytes/minerals to help you look and feel your best everyday.
                            </p>
                            <div className="reveal-text space-y-8 pt-12 border-t border-stone-200">
                                <p className="text-base font-bold uppercase tracking-widest text-stone-400">Contaminants Targeted:</p>
                                <div className="flex flex-wrap gap-4">
                                    {['PFAS', 'Microplastics', 'Lead', 'Mercury', 'VOCs', 'Pharmaceuticals'].map(tag => (
                                        <span key={tag} className="bg-stone-100 text-stone-600 px-5 py-2.5 rounded-full text-base font-bold tracking-wide">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-[3rem] p-12 md:p-20 border border-stone-200 shadow-sm flex flex-col items-center text-center">
                            <div className="mb-16 w-full border-b border-stone-100 pb-10">
                                <span className="text-[14px] font-bold uppercase tracking-widest text-[#f2663b] block mb-5">Certification Design Standards</span>
                                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#2A2422] uppercase">
                                    DESIGNED TO MEET NSF/ANSI
                                </h3>
                            </div>
                            <div className="space-y-12 w-full">
                                {[
                                    { id: '42', label: 'Esthetics', desc: 'Chlorine, taste & odor' },
                                    { id: '53', label: 'Health', desc: 'Lead, PFAS, VOCs' },
                                    { id: '401', label: 'Emerging', desc: 'Pharmaceuticals' },
                                    { id: '173', label: 'Dietary Supplement', desc: 'Electrolytes & Minerals' }
                                ].map(std => (
                                    <div key={std.id}>
                                        <p className="text-3xl md:text-5xl font-bold text-[#2A2422] mb-2 leading-none">NSF/ANSI {std.id}</p>
                                        <p className="text-xs md:text-base text-stone-400 uppercase tracking-[0.2em] font-bold">{std.label}: {std.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 02. Hydrogen - Integrated Section */}
                <section className="science-section max-w-[1440px] mx-auto px-6 md:px-12 mb-32">
                    <div className="max-w-5xl mb-24">
                        <Label className="text-[#f2663b] mb-8">Molecular Properties</Label>
                        <h2 className="reveal-text text-6xl md:text-8xl font-semibold tracking-tight text-[#2A2422] leading-[1.05] mb-12">
                            The Power of Hydrogen (H₂).
                        </h2>
                        <p className="reveal-text text-3xl md:text-4xl text-stone-500 leading-relaxed font-light">
                            Hydrogen is one of nature’s most effective tools for wellness. Peer-reviewed studies suggest that molecular hydrogen acts as a <span className="text-[#2A2422] font-semibold">selective antioxidant</span>, targeting the most destructive free radicals without disrupting essential signaling molecules.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 data-grid">
                        {mergedBenefits.map((benefit, idx) => (
                            <div key={idx} className="data-card bg-white p-12 md:p-20 rounded-[4rem] border border-stone-200 shadow-sm flex flex-col h-full hover:shadow-2xl transition-all duration-700 group">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="bg-orange-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-[#f2663b]">
                                        <span className="font-mono text-2xl font-bold">0{idx + 1}</span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[#f2663b] bg-orange-50/50 px-6 py-2.5 rounded-full uppercase tracking-[0.2em]">{benefit.stats}</span>
                                </div>
                                
                                <h4 className="text-4xl md:text-5xl font-bold text-[#2A2422] mb-8 tracking-tight leading-none">{benefit.title}</h4>
                                <p className="text-2xl md:text-3xl text-stone-600 leading-relaxed mb-12">{benefit.desc}</p>
                                
                                <div className="mt-auto">
                                    <div className="pt-12 border-t border-stone-100">
                                        <p className="text-stone-500 text-base md:text-lg leading-relaxed mb-10">
                                            {benefit.details}
                                        </p>
                                        
                                        <div className="bg-stone-50 rounded-[2.5rem] p-10 md:p-12 group-hover:bg-orange-50/30 transition-colors">
                                            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-5">Key Research Paper</p>
                                            <a 
                                                href={`https://doi.org/${benefit.paper.doi}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="block group/link"
                                            >
                                                <div className="text-lg md:text-xl font-bold text-[#2A2422] group-hover/link:text-[#f2663b] transition-colors leading-snug mb-4 flex items-start gap-2">
                                                    {benefit.paper.title}
                                                    <Icons.ArrowRight className="w-5 h-5 mt-2 shrink-0 -rotate-45" />
                                                </div>
                                                <div className="text-sm md:text-base text-stone-500 font-medium">{benefit.paper.cite}</div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 03. Call to Action */}
                <section className="science-section max-w-[1440px] mx-auto px-6 md:px-12">
                    <div className="bg-[#2A2422] rounded-[3rem] p-12 md:p-24 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800/40 via-transparent to-transparent"></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-8 leading-tight">Evidence-Based Wellness.</h2>
                            <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-light mb-12">
                                Viven technology is rooted in peer-reviewed research and optimized for seamless integration into everyday life.
                            </p>
                            <a href="/#reserve">
                                <button className="bg-white text-[#2A2422] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#f2663b] hover:text-white transition-all duration-300 shadow-xl">
                                    Reserve the Kitchen Faucet+
                                </button>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default SciencePage;
