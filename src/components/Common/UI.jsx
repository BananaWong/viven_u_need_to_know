import React, { useState, useEffect, useRef } from 'react';

export const GridOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(242, 102, 59, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 102, 59, 0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
);

export const RevealOnScroll = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 50px 0px"
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const Label = ({ children, className = "text-[#5C5552]" }) => (
  <span className={`font-mono text-[13.5px] md:text-[15px] uppercase tracking-[0.2em] block mb-2 md:mb-3 font-semibold leading-[1.25] ${className}`}>
    {children}
  </span>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const btnRef = useRef(null);
  const base = "h-11 px-6 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 rounded-full cursor-pointer transform hover:-translate-y-0.5 active:scale-95";

  const styles = {
    primary: "bg-[#d94e24] text-white hover:bg-[#c24520] hover:shadow-xl hover:shadow-[#f2663b]/20 border border-transparent",
    secondary: "bg-white text-[#2A2422] border border-stone-200 hover:bg-[#FFF7ED] hover:border-[#f2663b]/30 shadow-sm",
    outline: "bg-white/10 backdrop-blur-md text-white border border-white/40 hover:bg-white/20 hover:border-white",
    black: "bg-[#1C1917] text-white hover:bg-black border border-transparent shadow-xl shadow-stone-900/15",
    ghost: "bg-transparent text-[#5C5552] hover:text-[#f2663b]"
  };

  useEffect(() => {
    const el = btnRef.current;
    if (!el || variant !== 'primary' || !window.gsap) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      window.gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      window.gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    };

    if (window.innerWidth >= 768) {
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [variant]);

  return (
    <button ref={btnRef} className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
