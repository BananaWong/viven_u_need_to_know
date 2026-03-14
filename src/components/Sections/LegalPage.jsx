import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const LegalPage = ({ title, content }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [title]);

    return (
        <div className="bg-[#FCFBF9] text-[#2A2422] font-sans selection:bg-[#f2663b] selection:text-white antialiased">
            <Header />
            
            <main className="pt-32 pb-24 md:pt-48 md:pb-32 px-6">
                <div className="max-w-[800px] mx-auto">
                    <h1 className="text-4xl md:text-6xl font-medium tracking-tighter mb-12 md:mb-20 text-center">
                        {title}
                    </h1>
                    
                    <div className="prose prose-stone max-w-none 
                        prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-[#2A2422]
                        prose-p:text-stone-600 prose-p:leading-relaxed prose-p:mb-6
                        prose-li:text-stone-600 prose-li:mb-2
                        prose-strong:text-[#2A2422] prose-strong:font-semibold
                    ">
                        {content}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LegalPage;
