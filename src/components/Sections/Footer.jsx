import React from 'react';
import { Link } from 'react-router-dom';
import { RevealOnScroll } from '../Common/UI';
import Icons from '../Icons';

const Footer = () => {
    return (
        <footer className="bg-[#F5F5F7] py-12 border-t border-stone-200 relative overflow-hidden">
            <RevealOnScroll>
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-4 pb-4 flex flex-col items-center text-[9px] md:text-[10px] text-stone-400 font-mono uppercase tracking-widest gap-8">
                    {/* Social & Contact */}
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                        <a href="mailto:shashank@vivenwater.com" className="group flex items-center hover:scale-110 transition-transform duration-300" aria-label="Mail Us">
                            <Icons.Mail className="w-5 h-5 text-stone-400 group-hover:text-stone-600" />
                        </a>
                        <a href="https://www.facebook.com/vivenwater" target="_blank" rel="noopener noreferrer" className="group flex items-center hover:scale-110 transition-transform duration-300" aria-label="Facebook">
                            <Icons.Facebook className="w-5 h-5" color="original" />
                        </a>
                        <a href="https://www.instagram.com/vivenwater" target="_blank" rel="noopener noreferrer" className="group flex items-center hover:scale-110 transition-transform duration-300" aria-label="Instagram">
                            <Icons.Instagram className="w-5 h-5" color="original" />
                        </a>
                        <a href="tel:+14083573837" className="group flex items-center hover:scale-110 transition-transform duration-300" aria-label="Call us">
                            <Icons.Phone className="w-5 h-5 text-stone-400 group-hover:text-stone-600" />
                        </a>
                    </div>

                    <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-end gap-4 md:gap-0 pt-4 border-t border-stone-100/50">
                        <div className="text-center md:text-left">
                            <span className="block text-stone-400 mb-2">Viven, Inc.</span>
                            <span>© 2026 / All Rights Reserved</span>
                        </div>
                        <div className="flex gap-6">
                            <Link to="/terms" className="hover:text-[#2A2422] transition-colors">Terms of Use</Link>
                            <Link to="/privacy" className="hover:text-[#2A2422] transition-colors">Privacy</Link>
                        </div>
                    </div>
                </div>
            </RevealOnScroll>
        </footer>
    );
};

export default Footer;
