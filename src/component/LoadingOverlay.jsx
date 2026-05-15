import React from 'react';
import { motion } from 'framer-motion';
import logo from "../assets/lOGO.png";

const LoadingOverlay = ({ message = "Processing your request..." }) => {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-primary-dark/80 backdrop-blur-md">
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Animated Glow Ring */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl"
          />
          
          {/* Pulsing Logo */}
          <motion.img 
            src={logo} 
            alt="Cleaniq" 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-auto relative z-10"
          />
        </div>
        
        {/* Loading Text */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-white font-black uppercase tracking-[0.3em] text-xs"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
