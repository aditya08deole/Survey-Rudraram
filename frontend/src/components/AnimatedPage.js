/**
 * Animated Page Wrapper
 * Provides consistent page transition animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../animations/transitions';

const AnimatedPage = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
