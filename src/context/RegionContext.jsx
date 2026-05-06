import React, { createContext, useContext, useState, useEffect } from 'react';

const RegionContext = createContext();

export const regions = {
  UK: {
    id: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    paymentGateways: ['stripe'],
    basePrice: 20, // Example base price in GBP
  },
  NG: {
    id: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    symbol: '₦',
    locale: 'en-NG',
    paymentGateways: ['paystack', 'flutterwave'],
    basePrice: 15000, // Example base price in NGN
  }
};

export const RegionProvider = ({ children }) => {
  const [region, setRegion] = useState(() => {
    const saved = localStorage.getItem('cleaniq_region');
    return saved ? JSON.parse(saved) : regions.UK;
  });

  useEffect(() => {
    localStorage.setItem('cleaniq_region', JSON.stringify(region));
  }, [region]);

  const toggleRegion = (regionId) => {
    setRegion(regions[regionId]);
  };

  return (
    <RegionContext.Provider value={{ region, toggleRegion, regions }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
