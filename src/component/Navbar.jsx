import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRegion } from "../context/RegionContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { Menu, X, Globe, ChevronDown, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/lOGO.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { region, toggleRegion, regions } = useRegion();
  const { customer, logout } = useCustomerAuth();
  const [isGuest, setIsGuest] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Do not auto-hide Sign up based on a transient guest flag.
    setIsGuest(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Booking", path: "/booking" },
    { name: "Join Our Team", path: "/recruitment" },
  ];

  const isAccountPage = location.pathname.startsWith("/account");

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "top-0 glass-dark py-2 md:py-3 shadow-2xl shadow-black/20"
          : `${isAccountPage ? "top-0" : "top-[80px] md:top-[52px]"} bg-primary py-4 md:py-6`
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="relative"
          >
            <img
              src={logo}
              alt="Cleaniq Services"
              className="w-auto h-14 md:h-16 transition-all duration-300 brightness-100"
            />
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
                <span
                  className={`text-sm font-bold tracking-wide transition-colors ${
                    location.pathname === link.path
                      ? "text-secondary"
                      : "text-white/80 hover:text-white"
                  }`}
                >
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

          {/* Account actions */}
          {customer ? (
            <div className="flex items-center gap-3">
              <Link
                to="/account/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white text-xs font-black"
              >
                <User size={14} /> {customer.firstName}
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-full bg-white/10 hover:bg-rose-500/30 text-white/60 hover:text-white transition-all"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/account/login"
                className="text-white/90 font-black text-sm px-4 py-2 rounded-full hover:bg-white/10 transition-all"
              >
                Log in
              </Link>
            </div>
          )}

          <Link
            to="/booking"
            className="btn-secondary px-8 text-primary shadow-secondary/10"
          >
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
              className="fixed inset-0 bg-primary-dark/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-[85%] max-w-sm glass-dark shadow-[-20px_0_50px_rgba(0,0,0,0.5)] md:hidden flex flex-col z-50"
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex justify-between items-center mb-10 md:12">
                  <img
                    src={logo}
                    alt="Cleaniq Services"
                    className="h-7 w-auto"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white p-2"
                  >
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
                        className={`text-xl md:text-2xl font-bold block tracking-tight ${
                          location.pathname === link.path
                            ? "text-secondary"
                            : "text-white"
                        }`}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto space-y-6 md:8">
                  <div className="h-px bg-white/10 w-full" />

                  {customer ? (
                    <div className="space-y-3">
                      <Link
                        to="/account/dashboard"
                        className="flex items-center gap-3 w-full py-3 px-4 bg-white/10 rounded-2xl text-white font-black text-sm"
                      >
                        <User size={16} /> {customer.firstName}{" "}
                        {customer.lastName}
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 w-full py-3 px-4 bg-white/5 rounded-2xl text-white/60 font-black text-sm hover:bg-rose-500/20 hover:text-white transition-all"
                      >
                        <LogOut size={16} /> Log out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/account/login"
                        className="flex items-center gap-3 w-full py-3 px-4 border border-white/20 rounded-2xl text-white/80 font-black text-sm hover:bg-white/10 transition-all"
                      >
                        <User size={16} /> Log in
                      </Link>
                      {!isGuest && (
                        <Link
                          to="/account/signup"
                          className="flex items-center gap-3 w-full py-3 px-4 bg-white/10 rounded-2xl text-white font-black text-sm justify-center"
                        >
                          Sign up
                        </Link>
                      )}
                    </div>
                  )}

                  <Link
                    to="/booking"
                    className="btn-secondary w-full py-4 md:py-5 text-base md:text-lg text-center shadow-xl shadow-secondary/5"
                  >
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
