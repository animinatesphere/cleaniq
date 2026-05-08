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
    basePrice: 20,
    contact: {
      phone: '+44 7752 476368',
      email: 'info@cleaniqservices.com',
      address: 'First Floor, Swan Buildings, 20 Swan St, Manchester M4 5JW, United Kingdom'
    }
  },
  NG: {
    id: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    symbol: '₦',
    locale: 'en-NG',
    paymentGateways: ['paystack', 'flutterwave'],
    basePrice: 15000,
    contact: {
      phone: '+234 801 234 5678',
      email: 'hello@cleaniq.com.ng',
      address: 'Lagos Office: Victoria Island, Lagos, Nigeria'
    }
  }
};

export const RegionProvider = ({ children }) => {
  const [region, setRegion] = useState(() => {
    const saved = localStorage.getItem('cleaniq_region');
    if (saved) {
      const savedData = JSON.parse(saved);
      // Ensure we get the latest data for the saved region ID
      return regions[savedData.id] || regions.UK;
    }
    return regions.UK;
  });

  useEffect(() => {
    localStorage.setItem('cleaniq_region', JSON.stringify({ id: region.id }));
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
