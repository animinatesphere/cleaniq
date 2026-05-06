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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Booking', path: '/booking' },
    { name: 'Recruitment', path: '/recruitment' },
  ];

  return (
    <nav className={`fixed w-full bg-[#005B41] z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'bg-[#005B41] py-5 '}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center ">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className='w-30 h-10' />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-medium transition-colors hover:text-secondary ${
                location.pathname === link.path ? 'text-secondary' : 'text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Region Toggle */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-white/50 hover:bg-white transition-all">
              <Globe size={18} className="text-primary" />
              <span className="text-sm font-semibold text-primary">{region.id} ({region.currency})</span>
              <ChevronDown size={14} className="text-primary" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
              {Object.values(regions).map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleRegion(r.id)}
                  className={`w-full text-left px-5 py-3 text-sm hover:bg-slate-50 transition-colors flex justify-between items-center ${region.id === r.id ? 'bg-slate-50 text-secondary' : 'text-primary-dark'}`}
                >
                  <span>{r.name}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{r.currency}</span>
                </button>
              ))}
            </div>
          </div>

          <Link to="/booking" className="btn-primary">
            Book Now
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-semibold ${
                    location.pathname === link.path ? 'text-secondary' : 'text-primary-dark'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <div className="flex justify-between items-center py-2">
                <span className="text-primary-dark font-medium">Market Region</span>
                <div className="flex gap-2">
                  {Object.values(regions).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        toggleRegion(r.id);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${region.id === r.id ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/booking" onClick={() => setIsOpen(false)} className="btn-primary text-center">
                Book Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
