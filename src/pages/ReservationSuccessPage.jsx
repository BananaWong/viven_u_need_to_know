import React, { useEffect } from 'react';
import Header from '../components/Sections/Header';
import Footer from '../components/Sections/Footer';

const ReservationSuccessPage = () => {
  useEffect(() => {
    // 1. 触发 Meta Pixel Purchase (购买成功) 事件
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: 50,
        currency: 'USD'
      });
    }

    window.scrollTo(0, 0);

    // 2. 等待 2.5 秒后，自动跳转到指定的 Google Form 问卷
    const timer = setTimeout(() => {
      window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSf5MT0j23Ei-4uxszGdS6-R6LTdNoyDbpjzICpmlMCCVZBoCA/viewform';
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#FCFBF9] min-h-screen flex flex-col font-sans selection:bg-[#f2663b] selection:text-white antialiased">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-6 animate-in fade-in duration-1000">
        <div className="max-w-3xl w-full text-center">
            {/* 顶部 Label */}
            <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-widest text-[#f2663b] block mb-8">
                Reservation Confirmed
            </span>
            
            {/* 核心大标题 */}
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-[#2A2422] leading-[1.05] mb-8">
                Thank you for your support.
            </h1>
            
            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-stone-500 leading-relaxed font-light mb-16">
                Your spot in line is secure. Please don't close this window—we are safely redirecting you to complete your setup.
            </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReservationSuccessPage;
