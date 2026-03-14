import { useEffect } from 'react';

export const useGSAP = (callback, config = {}) => {
  const { scope, dependencies = [] } = config;
  useEffect(() => {
    if (!window.gsap) return;
    const ctx = window.gsap.context(callback, scope);
    return () => ctx.revert();
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};
