import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerAuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL;

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const token = localStorage.getItem('ciq_customer_token');
    const saved = localStorage.getItem('ciq_customer_data');
    if (token && saved) {
      try {
        setCustomer(JSON.parse(saved));
      } catch {
        localStorage.removeItem('ciq_customer_token');
        localStorage.removeItem('ciq_customer_data');
      }
    }
    setLoading(false);
  }, []);

  const register = async ({ firstName, lastName, email, phone, password }) => {
    const res = await fetch(`${API}/customer-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('ciq_customer_token', data.token);
    localStorage.setItem('ciq_customer_data', JSON.stringify(data.customer));
    setCustomer(data.customer);
    return data.customer;
  };

  const login = async ({ email, password }) => {
    const res = await fetch(`${API}/customer-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('ciq_customer_token', data.token);
    localStorage.setItem('ciq_customer_data', JSON.stringify(data.customer));
    setCustomer(data.customer);
    return data.customer;
  };

  const logout = () => {
    localStorage.removeItem('ciq_customer_token');
    localStorage.removeItem('ciq_customer_data');
    setCustomer(null);
  };

  const getToken = () => localStorage.getItem('ciq_customer_token');

  const authFetch = async (url, options = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, register, login, logout, getToken, authFetch }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);
