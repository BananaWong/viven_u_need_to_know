import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Common Components
import { GridOverlay } from './components/Common/UI';

// Sections
import Header from './components/Sections/Header';
import Hero from './components/Sections/Hero';
import ComparisonSection from './components/Sections/ComparisonSection';
import ProblemSection from './components/Sections/ProblemSection';
import IntegratedScanner from './components/Sections/IntegratedScanner';
import ProductAnatomySection from './components/Sections/ProductAnatomySection';
import TechnologySection from './components/Sections/TechnologySection';
import ProductFinishesSection from './components/Sections/ProductFinishesSection';
import ReserveCTASection from './components/Sections/ReserveCTASection';
import FAQSection from './components/Sections/FAQSection';
import TeamSection from './components/Sections/TeamSection';
import Footer from './components/Sections/Footer';
import SciencePage from './components/Sections/SciencePage';
import LegalPage from './components/Sections/LegalPage';
import DataCheckPage from './pages/DataCheckPage';
import CookieConsent from './components/Sections/CookieConsent';
import EmailPopup from './components/Sections/EmailPopup';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from './constants/data.jsx';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const HomePage = () => {
  useEffect(() => {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
  }, []);

  return (
    <div className="bg-[#FCFBF9] text-[#2A2422] font-sans selection:bg-[#f2663b] selection:text-white antialiased relative">
      <Header />
      <Hero />
      <ProblemSection />
      <ComparisonSection />
      <IntegratedScanner />
      <ProductAnatomySection />
      <div className="bg-white">
         <TechnologySection />
      </div>
      <ProductFinishesSection />
      <ReserveCTASection />
      <FAQSection />
      <TeamSection />
      <Footer />

      {/* Version Switcher */}
      {/* <div className="hidden md:flex" style={{position:'fixed',bottom:'24px',right:'24px',zIndex:9999,gap:'8px',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',borderRadius:'99px',padding:'6px 10px',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>
        <span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',letterSpacing:'0.05em',alignSelf:'center',paddingLeft:'4px',paddingRight:'2px'}}>VERSION</span>
        <span style={{background:'#f2663b',color:'#fff',fontSize:'12px',fontWeight:600,padding:'4px 12px',borderRadius:'99px',letterSpacing:'0.05em'}}>DESIGNER</span>
        <a href="https://biohacker.bananawong.com" style={{color:'rgba(255,255,255,0.6)',fontSize:'12px',fontWeight:500,padding:'4px 12px',borderRadius:'99px',letterSpacing:'0.05em',textDecoration:'none',transition:'all 0.2s'}} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.6)'}>BIOHACKER</a>
      </div> */}
    </div>
  );
};

export default function App() {
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = 'https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1770841449/faviconV2_jgop1q.png';
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/science" element={<SciencePage />} />
        {/* Handle legacy URL from user request if needed, or just standard route */}
        <Route path="/science/" element={<SciencePage />} />
        <Route path="/datacheck" element={<DataCheckPage />} />
        <Route path="/datacheck/:zip" element={<DataCheckPage />} />
        <Route path="/terms" element={<LegalPage title={TERMS_OF_SERVICE.title} content={TERMS_OF_SERVICE.content} />} />
        <Route path="/privacy" element={<LegalPage title={PRIVACY_POLICY.title} content={PRIVACY_POLICY.content} />} />
      </Routes>
      <CookieConsent />
      <EmailPopup />
    </Router>
  );
}
