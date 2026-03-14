import React, { useState } from 'react';
import Icons from '../Icons';
import { Button } from '../Common/UI';

const IntegratedScanner = () => {
  const [step, setStep] = useState('input');
  const [zip, setZip] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  const handleScan = (e) => {
    e.preventDefault();
    if(!zip) return;
    setStep('scanning');
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('result');
          return 100;
        }
        return prev + 2;
      });
    }, 25);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-6 md:px-0">
        <div className="text-center mb-6">
            <h3 className="text-lg font-bold uppercase tracking-widest text-[#f2663b] mb-2 flex items-center justify-center gap-2">
                <Icons.MapPin className="w-3 h-3"/> EPA Database Check
            </h3>
        </div>

        {step === 'input' && (
            <div className="bg-white rounded-3xl md:rounded-full p-2 shadow-xl shadow-[#2A2422]/5 border border-stone-100 flex flex-col md:flex-row items-center gap-2 transition-all">
                <div className="flex-1 w-full relative">
                    <input 
                        type="text" 
                        placeholder="Enter your zip code"
                        className="w-full h-12 md:h-14 pl-6 md:pl-8 pr-6 rounded-full bg-transparent text-[#2A2422] font-normal placeholder:text-stone-400 focus:outline-none focus:bg-[#FFF7ED] transition-colors text-base md:text-lg text-center md:text-left"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                    />
                </div>
                <Button variant="primary" className="w-full md:w-auto h-12 md:h-14 px-8 md:px-10 shrink-0" onClick={handleScan}>
                    RUN DIAGNOSTIC
                </Button>
            </div>
        )}

        {step === 'scanning' && (
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-stone-100 text-center">
                <div className="mb-6 relative w-20 h-20 mx-auto">
                    <Icons.Spinner className="w-full h-full text-[#f2663b] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono">{scanProgress}%</div>
                </div>
                <h4 className="text-xl font-semibold mb-2">Analyzing local ground water...</h4>
                <p className="text-stone-500 text-sm">Cross-referencing EPA records for Zip Code {zip}</p>
            </div>
        )}

        {step === 'result' && (
            <div className="bg-[#1C1917] rounded-[2rem] p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Icons.Shield className="w-32 h-32" /></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Icons.AlertTriangle className="w-3 h-3" /> Critical Contaminants Found
                    </div>
                    <h4 className="text-2xl md:text-3xl font-semibold mb-4 leading-tight">
                        Multiple health-standard violations detected in your area.
                    </h4>
                    <p className="text-stone-400 text-sm md:text-base mb-8 max-w-lg leading-relaxed">
                        Data indicates levels of Arsenic and PFAS exceeding recent health guidelines. Viven is engineered to remove 99.9% of these specific compounds.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="primary" onClick={() => setStep('input')} className="text-[10px]">NEW SEARCH</Button>
                        <Button variant="outline" className="text-[10px]">VIEW FULL REPORT</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default IntegratedScanner;
