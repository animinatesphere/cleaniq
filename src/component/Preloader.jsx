import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/lOGO.png";

const Preloader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load or wait for window load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-9999 bg-primary flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Decorative Rings */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] border border-white rounded-full"
          />
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.05 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute w-[400px] h-[400px] md:w-[800px] md:h-[800px] border border-white rounded-full"
          />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
              }}
              transition={{ 
                duration: 1,
                ease: "easeOut"
              }}
              className="relative"
            >
              {/* Main Logo */}
              <img 
                src={logo} 
                alt="CLEANIQ SERVICES" 
                className="h-12 md:h-20 w-auto relative z-10"
              />
              
              {/* Shine/Sweep Effect */}
              <motion.div
                animate={{ 
                  left: ["-100%", "200%"],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute inset-0 z-20 bg-linear-to-r from-transparent via-white/30 to-transparent w-full h-full skew-x-[-20deg]"
              />
            </motion.div>

            {/* Loading Bar */}
            <div className="mt-12 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-secondary shadow-[0_0_10px_rgba(247,194,66,0.5)]"
              />
            </div>
            
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-[10px] md:text-xs font-black text-white/40  tracking-[0.4em] italic"
            >
              Precision cleaning, genuine care
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
