import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import {
  Menu,
  X,
  User,
  LogOut,
  Home,
  Info,
  Briefcase,
  Calendar,
  Users,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/lOGO.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { logout } = useCustomerAuth();
  const { customer } = useCustomerAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "About", path: "/about", icon: Info },
    { name: "Services", path: "/services", icon: Briefcase },
    { name: "Blog", path: "/blog", icon: BookOpen },
    { name: "Join Team", path: "/recruitment", icon: Users },
  ];

  const isAccountPage = location.pathname.startsWith("/account");

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "top-0 glass-dark py-2.5 md:py-3 shadow-2xl shadow-black/30"
          : `${isAccountPage ? "top-0" : "top-[80px] md:top-[52px]"} bg-primary py-3.5 md:py-4`
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo - Professional Sizing */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <motion.div
            whileHover={{ rotate: 3, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="relative"
          >
            <img
              src={logo}
              alt="Cleaniq Services"
              className="w-auto h-10 md:h-11 transition-all duration-300 brightness-100"
            />
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {/* Navigation Icons with Text */}
          <div className="flex items-end gap-8">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex flex-col items-center gap-2 group transition-all"
                >
                  <motion.div
                    whileHover={{ scale: 1.12, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-secondary text-primary shadow-lg shadow-secondary/50"
                        : "bg-white/8 text-white/70 group-hover:bg-white/15 group-hover:text-white"
                    }`}
                  >
                    <IconComponent size={18} strokeWidth={1.8} />
                  </motion.div>
                  <span
                    className={`text-[10px] md:text-xs font-bold tracking-wide uppercase transition-colors ${
                      isActive ? "text-secondary font-black" : "text-white/75"
                    }`}
                  >
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="h-7 w-px bg-white/15" />

          {/* Account & Book Section */}
          <div className="flex items-center gap-6">
            {/* Account Actions */}
            {customer ? (
              <Link
                to="/account/dashboard"
                className="flex flex-col items-center gap-2 group transition-all"
              >
                <motion.div
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="p-2 rounded-lg bg-white/8 text-white/70 group-hover:bg-white/15 group-hover:text-white transition-all duration-300"
                >
                  <User size={18} strokeWidth={1.8} />
                </motion.div>
                <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase text-white/75">
                  Account
                </span>
              </Link>
            ) : (
              <Link
                to="/account/login"
                className="flex flex-col items-center gap-2 group transition-all"
              >
                <motion.div
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="p-2 rounded-lg bg-white/8 text-white/70 group-hover:bg-white/15 group-hover:text-white transition-all duration-300"
                >
                  <User size={18} strokeWidth={1.8} />
                </motion.div>
                <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase text-white/75">
                  Log In
                </span>
              </Link>
            )}

            {/* Book Now Button */}
            <Link
              to="/booking"
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <motion.div
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="px-4 py-2 rounded-lg bg-secondary text-primary font-black shadow-lg shadow-secondary/50 group-hover:shadow-secondary/70 transition-all duration-300"
              >
                <Calendar size={18} strokeWidth={2} />
              </motion.div>
              <span className="text-[10px] md:text-xs font-black tracking-wide uppercase text-secondary">
                Book Now
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2.5 rounded-lg transition-all text-white bg-white/10 hover:bg-white/20"
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
                <div className="flex justify-between items-center mb-8">
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

                <div className="space-y-4">
                  {navLinks.map((link, i) => {
                    const IconComponent = link.icon;
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        key={link.path}
                      >
                        <Link
                          to={link.path}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            location.pathname === link.path
                              ? "bg-secondary/20 text-secondary font-bold"
                              : "text-white/80 hover:bg-white/10 hover:text-white font-semibold"
                          }`}
                        >
                          <IconComponent size={20} strokeWidth={1.8} />
                          <span className="text-base tracking-tight">
                            {link.name}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-auto space-y-6">
                  <div className="h-px bg-white/15 w-full" />

                  {customer ? (
                    <div className="space-y-3">
                      <Link
                        to="/account/dashboard"
                        className="flex items-center gap-3 w-full py-3 px-4 bg-white/10 rounded-lg text-white font-semibold text-sm transition-all hover:bg-white/15"
                      >
                        <User size={16} strokeWidth={1.5} /> Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 w-full py-3 px-4 bg-white/5 rounded-lg text-white/70 font-semibold text-sm hover:bg-rose-500/20 hover:text-white transition-all"
                      >
                        <LogOut size={16} strokeWidth={1.5} /> Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/account/login"
                        className="flex items-center gap-3 w-full py-3 px-4 border border-white/20 rounded-lg text-white/80 font-semibold text-sm hover:bg-white/10 transition-all"
                      >
                        <User size={16} strokeWidth={1.5} /> Log In
                      </Link>
                      <Link
                        to="/account/signup"
                        className="flex items-center gap-3 w-full py-3 px-4 bg-white/10 rounded-lg text-white font-semibold text-sm justify-center hover:bg-white/15 transition-all"
                      >
                        <span>Sign Up</span>
                      </Link>
                    </div>
                  )}

                  <Link
                    to="/booking"
                    className="btn-secondary w-full py-3.5 text-base font-bold text-center shadow-lg shadow-secondary/30 flex items-center justify-center gap-2 rounded-lg transition-all hover:shadow-secondary/50"
                  >
                    <Calendar size={18} strokeWidth={2} /> Book Clean
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
