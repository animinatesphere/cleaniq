import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../assets/lOGO.png"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { region, toggleRegion, regions } = useRegion();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Booking', path: '/booking' },
    { name: 'Join Our Team', path: '/recruitment' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'top-0 glass-dark py-2 md:py-3 shadow-2xl shadow-black/20' : 'top-[80px] md:top-[52px] bg-primary py-4 md:py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="relative"
          >
            <img src={logo} alt="Cleaniq Services" className="w-auto h-14 md:h-16 transition-all duration-300 brightness-100" />
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative group py-2"
              >
                <span className={`text-sm font-bold tracking-wide transition-colors ${
                  location.pathname === link.path ? 'text-secondary' : 'text-white/80 hover:text-white'
                }`}>
                  {link.name}
                </span>
                {location.pathname === link.path && (
                  <motion.div 
                    layoutId="navUnderline"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary"
                  />
                )}
              </Link>
            ))}
          </div>
          
          <div className="h-6 w-px bg-white/10" />

          {/* Region Toggle */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
              <Globe size={16} className="text-secondary" />
              <span className="text-xs font-bold text-white">{region.id}</span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
            
            <div className="absolute right-0 mt-3 w-48 glass-dark rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden border border-white/10 backdrop-blur-2xl">
              <div className="p-2">
                {Object.values(regions).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRegion(r.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center group/item ${
                      region.id === r.id ? 'bg-white/10 text-secondary' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-lg">{r.currency}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Link to="/booking" className="btn-secondary px-8 text-primary shadow-secondary/10">
            Book Now
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 rounded-xl transition-colors text-white bg-white/10" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-primary-dark/60 backdrop-blur-sm z-[-1]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-screen w-[85%] max-w-sm glass-dark shadow-[-20px_0_50px_rgba(0,0,0,0.5)] md:hidden flex flex-col"
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex justify-between items-center mb-10 md:12">
                   <img src={logo} alt="Cleaniq Services" className="h-7 w-auto" />
                   <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white p-2">
                     <X size={24} />
                   </button>
                </div>

                <div className="space-y-5 md:6">
                  {navLinks.map((link, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={link.path}
                    >
                      <Link
                        to={link.path}
                        className={`text-xl md:text-2xl font-black block tracking-tight ${
                          location.pathname === link.path ? 'text-secondary' : 'text-white'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto space-y-6 md:8">
                  <div className="h-px bg-white/10 w-full" />
                  
                  <div className="space-y-4">
                    <h1 className="font-black text-lg leading-none uppercase tracking-tighter">Cleaniq</h1><span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Market Region</span>
                    <div className="flex gap-2">
                      {Object.values(regions).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            toggleRegion(r.id);
                            setIsOpen(false);
                          }}
                          className={`flex-1 py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold border transition-all ${
                            region.id === r.id ? 'bg-secondary text-primary border-secondary' : 'border-white/10 text-white hover:bg-white/5'
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link to="/booking" className="btn-secondary w-full py-4 md:py-5 text-base md:text-lg text-center shadow-xl shadow-secondary/5">
                    Book Professional Clean
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;



