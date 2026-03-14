import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icons from '../Icons';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen && window.gsap) {
      // Entrance animation for menu items
      const tl = window.gsap.timeline();
      
      tl.fromTo(".mobile-nav-item", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.6, ease: "power3.out", delay: 0.1 }
      );
      
      tl.fromTo(".mobile-cta-area",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        "-=0.3"
      );
    }
  }, [menuOpen]);

  const getNavLink = (href) => {
    if (href.startsWith('http')) return href;
    return isHomePage ? href : `/${href}`;
  };

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#FCFBF9]/95 backdrop-blur-xl border-b border-stone-100 shadow-sm py-2' : 'bg-transparent py-4 border-white/0'}`}>
        <div className="max-w-[1440px] mx-auto flex h-16 items-center px-6 md:px-12">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img 
              src="https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1768809175/unnamed_2_edo13w.png" 
              alt="Viven Logo" 
              className={`h-7 w-auto object-contain transition-all duration-300 ${(scrolled || !isHomePage) ? 'brightness-0 invert-0' : 'brightness-0 invert'}`} 
              style={{ filter: (scrolled || !isHomePage) ? 'none' : 'brightness(0) invert(1)' }} 
            />
          </Link>
          
          <div className="flex items-center ml-auto gap-8">
            <nav className={`hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 ${(scrolled || !isHomePage) ? 'text-[#5C5552]' : 'text-white/90'}`}>
              <a href={getNavLink("#comparison-bento")} className={`hover:text-[#f2663b] transition-colors`}>Why Viven</a>
              <a href={getNavLink("#problem")} className={`hover:text-[#f2663b] transition-colors`}>Problem</a>
              <a href={getNavLink("#product-hub")} className={`hover:text-[#f2663b] transition-colors`}>Solution</a>
              <a href={getNavLink("#team")} className={`hover:text-[#f2663b] transition-colors`}>Team</a>
              <a href={getNavLink("#faq")} className={`hover:text-[#f2663b] transition-colors`}>FAQ</a>
              <Link to="/science" className={`hover:text-[#f2663b] transition-colors ${location.pathname === '/science' ? 'text-[#f2663b]' : ''}`}>Science</Link>
            </nav>

            <a href={getNavLink("#reserve")} className="hidden md:block shrink-0">
              <button className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
                (scrolled || !isHomePage)
                  ? 'bg-[#f2663b] text-white hover:bg-[#d9552b] hover:shadow-lg hover:shadow-[#f2663b]/20' 
                  : 'bg-white text-[#2A2422] hover:bg-stone-100 hover:shadow-lg hover:shadow-black/10'
              }`}>
                Reserve Now
              </button>
            </a>

            <button className={`md:hidden relative z-50 transition-transform duration-300 active:scale-90 ${(scrolled || !isHomePage) ? 'text-[#2A2422]' : 'text-white'}`} onClick={() => setMenuOpen(!menuOpen)}>
               {menuOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#FCFBF9]/98 backdrop-blur-2xl pt-28 pb-10 px-8 md:hidden animate-in fade-in duration-500 ease-out">
           <nav className="flex flex-col h-full text-[#2A2422]">
              {/* Top border to create a "frame" for the list */}
              <div className="flex flex-col border-t border-stone-200/60 pt-2">
                {[
                  { name: 'Why Viven', href: '#comparison-bento', type: 'anchor' },
                  { name: 'Problem', href: '#problem', type: 'anchor' },
                  { name: 'Solution', href: '#product-hub', type: 'anchor' },
                  { name: 'Team', href: '#team', type: 'anchor' },
                  { name: 'FAQ', href: '#faq', type: 'anchor' },
                  { name: 'Science', href: '/science', type: 'link' }
                ].map((item) => (
                  item.type === 'anchor' ? (
                    <a 
                      key={item.name}
                      href={getNavLink(item.href)} 
                      className="mobile-nav-item opacity-0 text-xl font-semibold tracking-tight border-b border-stone-200/60 py-4 flex justify-between items-center group active:text-[#f2663b] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                      <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-active:text-[#f2663b]" />
                    </a>
                  ) : (
                    <Link 
                      key={item.name}
                      to={item.href} 
                      className="mobile-nav-item opacity-0 text-xl font-semibold tracking-tight border-b border-stone-200/60 py-4 flex justify-between items-center group active:text-[#f2663b] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                      <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-active:text-[#f2663b]" />
                    </Link>
                  )
                ))}
              </div>

              {/* Push CTA to the bottom */}
              <div className="mobile-cta-area opacity-0 mt-auto flex flex-col gap-3">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-stone-400">Join the movement</p>
                <a href={getNavLink("#reserve")} onClick={() => setMenuOpen(false)}>
                  <button className="w-full bg-[#f2663b] text-white py-4 rounded-xl font-semibold text-sm shadow-xl shadow-[#f2663b]/20">
                    Reserve Now
                  </button>
                </a>
              </div>
           </nav>
        </div>
      )}
    </>
  );
};

export default Header;
