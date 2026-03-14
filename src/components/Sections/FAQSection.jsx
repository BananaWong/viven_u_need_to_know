import React, { useState, useEffect, useRef } from 'react';
import { Label, RevealOnScroll } from '../Common/UI';
import Icons from '../Icons';
import { FAQ_DATA } from '../../constants/data.jsx';

const FAQItem = ({ question, answer, isOpen, onClick, id }) => {
  const contentRef = useRef(null);
  const isFirstMount = useRef(true);
  
  useEffect(() => {
    if (!window.gsap) return;
    
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (isOpen) {
        window.gsap.set(contentRef.current, { height: 'auto', opacity: 1 });
      }
      return;
    }

    if (isOpen) {
      window.gsap.to(contentRef.current, {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
    } else {
      window.gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isOpen]);

  return (
    <div className={`border-b border-stone-200/60 transition-colors duration-500 ${isOpen ? 'bg-stone-50/50' : 'bg-transparent'}`}>
      <button
        id={`faq-question-${id}`}
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={`faq-content-${id}`}
        className="w-full py-4 md:py-5 flex items-center justify-between text-left group transition-all"
      >
        <span className={`text-base md:text-lg font-medium tracking-tight pr-8 transition-colors duration-300 ${isOpen ? 'text-[#f2663b]' : 'text-[#2A2422] md:group-hover:text-[#f2663b]'}`}>
          {question}
        </span>
        <div className={`shrink-0 w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-[#f2663b] border-[#f2663b] rotate-45' : 'md:group-hover:border-[#f2663b]'}`}>
          <Icons.Plus className={`w-3.5 h-3.5 transition-colors duration-300 ${isOpen ? 'text-white' : 'text-stone-400 md:group-hover:text-[#f2663b]'}`} />
        </div>
      </button>
      
      <div 
        id={`faq-content-${id}`}
        ref={contentRef}
        role="region"
        aria-labelledby={`faq-question-${id}`}
        className="overflow-hidden h-0 opacity-0"
      >
        <div className="max-w-3xl pb-4 md:pb-6 px-0">
          <p className="text-stone-500 text-sm md:text-base leading-relaxed whitespace-pre-line">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const ContactCard = ({ className = "" }) => (
  <div className={`p-6 md:p-8 bg-white rounded-[2rem] border border-stone-100 shadow-sm ${className}`}>
    <p className="text-stone-400 text-sm mb-4">Still have questions?</p>
    <a 
      href="mailto:hello@vivenwater.com" 
      className="flex items-center gap-3 text-[#2A2422] font-semibold hover:text-[#f2663b] transition-colors group"
    >
      <span className="text-lg md:text-xl">hello@vivenwater.com</span>
      <Icons.ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
    </a>
  </div>
);

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-24 lg:py-32 bg-[#FCFBF9] border-t border-stone-100">
      <RevealOnScroll>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
            
            {/* Left Side: Header */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
              <Label className="text-[#f2663b] mb-3">Support · FAQ</Label>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-[0.95] mb-4">
                Common questions,<br />uncommon answers.
              </h2>
              <p className="text-stone-500 text-base md:text-lg font-normal leading-relaxed max-w-sm">
                Everything you need to know about the Viven ecosystem and our vision for better water.
              </p>
              
              <div className="mt-12 hidden lg:block">
                <ContactCard className="inline-block" />
              </div>
            </div>

            {/* Right Side: FAQ Accordion */}
            <div className="lg:col-span-8">
              <div className="border-t border-stone-200/60">
                {FAQ_DATA.map((faq, index) => (
                  <FAQItem
                    key={index}
                    id={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  />
                ))}
              </div>
              
              {/* Mobile Contact Box */}
              <div className="mt-12 lg:hidden text-center">
                <ContactCard />
              </div>
            </div>

          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};

export default FAQSection;
