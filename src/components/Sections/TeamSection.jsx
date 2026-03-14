import React from 'react';
import { RevealOnScroll } from '../Common/UI';

const TeamSection = () => {
  const team = [
    {
      name: 'Shashank Varma', title: 'Founder & CEO',
      photo: 'https://res.cloudinary.com/dsyxtnpgm/image/upload/f_auto,q_auto/v1768834399/1625676470209_poxtby.jpg',
      bio: <>Ex-<strong>Apple</strong> and ex-<strong>Kohler</strong>, started and led <strong>Kohler’s</strong> water filtration business. Led innovative consumer product development at <strong>Apple</strong>.</>,
      school: 'NYU · Mechanical Engineering',
      schoolLogos: [
          'https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772697044/apple_yglst8.png',
          'https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772696972/kohler_1_zmzfys.png'
      ],
      linkedin: 'https://www.linkedin.com/in/varmashashank/',
    },
    {
      name: 'Ling Weng', title: 'Product Lead',
      photo: 'https://res.cloudinary.com/dsyxtnpgm/image/upload/f_auto,q_auto/v1768834399/1680443458125_in1kgr.jpg',
      bio: <>Early product manager at <strong>Instant Pot</strong>. 12 years of experience building kitchen products loved by consumers.</>,
      school: 'University of Waterloo, Mathematics · UBC, MBA',
      schoolLogos: ['https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772697121/Instant_Pot_logo_fvx0o0.png'],
      linkedin: 'https://www.linkedin.com/in/lingweng/',
    },
    {
      name: 'Marshall Graybill', title: 'Mechanical Lead',
      photo: 'https://res.cloudinary.com/dsyxtnpgm/image/upload/f_auto,q_auto/v1768834399/1735866255474_rqtkyz.jpg',
      bio: <>Part of the product development team in <strong>Kohler’s</strong> water filtration business.</>,
      school: 'CU Boulder · ME PhD Candidate',
      schoolLogos: ['https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772696972/kohler_1_zmzfys.png'],
      linkedin: 'https://www.linkedin.com/in/marshallgraybill/',
    },
    {
      name: 'Dayton Simenz', title: 'Content Lead',
      photo: 'https://res.cloudinary.com/dsyxtnpgm/image/upload/f_auto,q_auto/v1768834400/1749505644724_ooyev0.jpg',
      bio: "Led original content creation to build community around wellness × real estate × early-stage tech.",
      school: 'Davidson College · BA Philosophy, Econ',
      schoolLogos: ['https://res.cloudinary.com/dsyxtnpgm/image/upload/f_auto,q_auto/v1769098479/DC_kju4ys.png'],
      linkedin: 'https://www.linkedin.com/in/dsimenz/',
    },
  ];

  return (
    <section id="team" className="py-32 bg-[#FCFBF9] border-t border-stone-100 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-50/60 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <RevealOnScroll className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] leading-[1.1]">
            30 years of experience,<br className="hidden md:block" /> now in your kitchen.
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-12">
          {team.map((m, i) => (
            <RevealOnScroll key={m.name} delay={i * 100} className="flex flex-col h-full">
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-center h-full group/card cursor-pointer"
              >
                <div className="relative group-hover/card:scale-105 transition-transform duration-300 mb-6">
                  <div className="absolute inset-0 bg-[#f2663b]/20 rounded-full blur opacity-30 group-hover/card:opacity-60 transition-opacity duration-500" />
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-32 h-32 rounded-full object-cover object-top relative z-10 border-2 border-stone-200 group-hover/card:border-[#f2663b]/40 transition-colors duration-300 shadow-lg"
                    loading="lazy"
                  />
                </div>

                <h4 className="text-xl font-bold tracking-tight text-[#2A2422] mb-1 group-hover/card:text-[#f2663b] transition-colors">{m.name}</h4>
                <div className="text-[#f2663b] text-[10px] font-bold uppercase tracking-widest mb-4">{m.title}</div>

                <div className="flex items-start justify-center px-2 h-[100px] md:h-[120px] mb-4 overflow-hidden">
                  <p className="text-sm text-[#5C5552] leading-relaxed font-medium">{m.bio}</p>
                </div>

                <div className="text-[#8C8278] text-[11px] w-full flex flex-col items-center">
                  <div className="w-full border-t border-stone-100 pt-5 md:pt-7">
                    {m.schoolLogos && m.schoolLogos.length > 0 && (
                      <div className="flex items-center justify-center gap-6 h-8 md:h-9 mb-3">
                        {m.schoolLogos.map((logo, idx) => {
                          const isKohler = logo.includes('kohler');
                          const isApple = logo.includes('apple');
                          const isInstantPot = logo.includes('Instant_Pot');
                          
                          // Custom sizing for visual parity
                          let logoClass = "h-full w-auto object-contain opacity-100";
                          if (isKohler) logoClass += " scale-[1.3] max-w-[80px]";
                          if (isApple) logoClass += " scale-[0.85] max-w-[28px]";
                          if (isInstantPot) logoClass += " scale-[1.1] max-w-[90px]";
                          
                          return (
                            <img
                              key={idx}
                              src={logo}
                              alt="Brand"
                              className={logoClass}
                              loading="lazy"
                            />
                          );
                        })}
                      </div>
                    )}
                    <span className="font-medium tracking-tight uppercase px-4">{m.school}</span>
                  </div>
                </div>
              </a>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
