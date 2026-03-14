import React, { useRef } from 'react';
import { useGSAP } from '../../hooks/useGSAP';
import Icons from '../Icons';

const ComparisonSection = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!window.gsap) return;
    
    const tl = window.gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      }
    });

    tl.fromTo('.bento-card', 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power4.out' }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="comparison-bento" className="min-h-screen bg-[#FCFBF9] font-sans text-[#2A2422] py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center overflow-hidden">
      
      {/* Dual Card Comparison Grid */}
      <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8" role="list">
        
        {/* LEFT COLUMN: Other Faucets and Filters (Defect Card) */}
        <div 
          className="bento-card bg-white rounded-[2rem] p-6 md:p-8 lg:p-10 flex flex-col items-center justify-between text-center relative overflow-hidden safari-rounded-fix shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-700 ease-out group min-h-[440px] lg:min-h-[520px]"
          role="listitem"
          aria-labelledby="card-title-defects"
        >
          
          {/* Status Quo Header - Height Synchronized */}
          <div className="relative z-10 w-full flex flex-col items-center text-center min-h-[120px] md:min-h-[140px] lg:min-h-[150px]">
            <p className="text-stone-400 text-[10px] md:text-[11px] font-bold tracking-widest uppercase mb-3 md:mb-4 flex items-center gap-2 font-mono">
              <Icons.Waves className="w-4 h-4" /> THE STATUS QUO
            </p>
            <h3 id="card-title-defects" className="text-3xl md:text-4xl lg:text-[42px] font-semibold tracking-tighter text-[#2A2422] mb-0 leading-[1.05]">
              Other Faucets<br />and Filters
            </h3>
          </div>

          {/* Image Zone - Height Synchronized */}
          <div className="relative z-10 w-full flex-grow flex items-center justify-center my-2 md:my-4 lg:my-1 min-h-[200px] md:min-h-[240px] lg:min-h-[260px] max-h-[320px]">
            <img
              src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1772766603/other_dvgkvt.webp"
              alt="Standard filters and faucets comparison"
              className="max-h-full h-auto max-w-full object-contain mix-blend-multiply drop-shadow-[0_15px_30px_rgba(0,0,0,0.08)] scale-[1.3] transition-transform duration-700"
            />
          </div>
          {/* Features Bottom Bar - Aligned Line */}
          <div className="relative z-10 w-full flex flex-col pt-6 border-t border-stone-100 text-left" role="group" aria-label="Status Quo Defects">
             
             {/* Row 1 */}
             <div className="flex items-start gap-3 min-h-[52px] mb-1">
               <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                 <Icons.Close className="w-3 h-3 text-stone-400" strokeWidth={4} />
               </div>
               <span className="font-medium text-stone-500 tracking-tight text-sm md:text-base leading-tight">Do not target modern contaminants like microplastics, PFAS, lead, disinfection byproducts.</span>
             </div>

             {/* Row 2 */}
             <div className="flex items-start gap-3 min-h-[52px] mb-1">
               <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                 <Icons.Close className="w-3 h-3 text-stone-400" strokeWidth={4} />
               </div>
               <span className="font-medium text-stone-500 tracking-tight text-sm md:text-base leading-tight">Do not add electrolytes or minerals to your drinking water.</span>
             </div>

             {/* Row 3 */}
             <div className="flex items-start gap-3 min-h-[52px]">
               <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                 <Icons.Close className="w-3 h-3 text-stone-400" strokeWidth={4} />
               </div>
               <span className="font-medium text-stone-500 tracking-tight text-sm md:text-base leading-tight">Are not easy to install, use or maintain.</span>
             </div>

          </div>
        </div>

        {/* RIGHT COLUMN: The Viven Hero Product */}
        <div 
          className="bento-card bg-white rounded-[2rem] p-6 md:p-8 lg:p-10 flex flex-col items-center justify-between text-center relative overflow-hidden safari-rounded-fix shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-[0_20px_60px_-15px_rgba(242,102,59,0.15)] transition-all duration-700 ease-out group min-h-[440px] lg:min-h-[520px]"
          role="listitem"
          aria-labelledby="card-title-viven-hero"
        >
          
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#f2663b]/10 to-transparent rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          {/* Viven Header - Height Synchronized */}
          <div className="relative z-10 w-full flex flex-col items-center text-center min-h-[120px] md:min-h-[140px] lg:min-h-[150px]">
            <p className="text-[#f2663b] text-[10px] md:text-[11px] font-bold tracking-widest uppercase mb-3 md:mb-4 flex items-center gap-2 font-mono">
              <Icons.Zap className="w-4 h-4" /> THE VIVEN STANDARD
            </p>
            <h3 id="card-title-viven-hero" className="text-3xl md:text-4xl lg:text-[42px] font-semibold tracking-tighter text-[#2A2422] mb-0 leading-[1.05]">
              All-in-One Wellness<br />Kitchen Faucet+
            </h3>
          </div>

          {/* Large Hero Image */}
          <div 
            className="relative z-10 w-full flex-grow flex items-center justify-center my-2 md:my-4 lg:my-1 min-h-[200px] md:min-h-[240px] lg:min-h-[260px] max-h-[320px]"
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-visible">
              <img 
                src="https://res.cloudinary.com/dsyxtnpgm/image/upload/v1773128010/pptFEC6.pptx_-_%E5%B7%B2%E8%87%AA%E5%8A%A8%E6%81%A2%E5%A4%8D_unpmv2.webp" 
                alt="Viven Surgical Grade Faucet" 
                className="max-h-full h-auto max-w-full object-contain mix-blend-multiply drop-shadow-[0_15px_30px_rgba(0,0,0,0.08)] scale-115 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Features Bottom Bar - Reverted to single column */}
          <div className="relative z-10 w-full flex flex-col pt-6 border-t border-stone-100 text-left" role="group" aria-label="Key Features">
             
             {/* Row 1 */}
             <div className="flex items-start gap-3 min-h-[52px] mb-1">
               <div className="w-5 h-5 rounded-full bg-[#f2663b]/10 flex items-center justify-center shrink-0 mt-0.5">
                 <Icons.Check className="w-3 h-3 text-[#f2663b]" strokeWidth={4} />
               </div>
               <span className="text-[#2A2422] tracking-tight text-sm md:text-base leading-tight"><strong className="font-bold">Cleans water</strong> of microplastics, PFAS, THMs, and more per NSF standards.</span>
             </div>

             {/* Row 2 */}
             <div className="flex items-start gap-3 min-h-[52px] mb-1">
               <div className="w-5 h-5 rounded-full bg-[#f2663b]/10 flex items-center justify-center shrink-0 mt-0.5">
                 <Icons.Check className="w-3 h-3 text-[#f2663b]" strokeWidth={4} />
               </div>
               <span className="text-[#2A2422] tracking-tight text-sm md:text-base leading-tight">Look and feel your best with added <strong className="font-bold">electrolytes/minerals</strong> and <strong className="font-bold">hydrogen</strong>.</span>
             </div>

             {/* Row 3 */}
             <div className="flex items-start gap-3 min-h-[52px]">
               <div className="w-5 h-5 rounded-full bg-[#f2663b]/10 flex items-center justify-center shrink-0 mt-0.5">
                 <Icons.Check className="w-3 h-3 text-[#f2663b]" strokeWidth={4} />
               </div>
               <span className="text-[#2A2422] tracking-tight text-sm md:text-base leading-tight"><strong className="font-bold">Renter-friendly</strong>: 5-minute, 1-tool installation. No plumber needed.</span>
             </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ComparisonSection;