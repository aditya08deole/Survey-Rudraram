/**
 * Loading Animation Component
 * Beautiful loading states with Lottie animations
 */

import React from 'react';
import { motion } from 'framer-motion';

const LoadingAnimation = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClass}>
      {/* Animated spinner */}
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-gray-200"
          initial={{ opacity: 0.3 }}
        />
        
        {/* Animated arc */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500"
          animate={{ 
            rotate: 360,
            borderTopColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#3b82f6']
          }}
          transition={{
            rotate: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            },
            borderTopColor: {
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }
          }}
        />
      </motion.div>

      {/* Loading message */}
      {message && (
        <motion.p
          className="mt-4 text-gray-600 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}

      {/* Pulsing dots */}
      <motion.div className="flex gap-2 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default LoadingAnimation;
