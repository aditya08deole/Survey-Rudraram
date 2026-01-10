/**
 * Animated Counter Component
 * Counts from 0 to target value with smooth animation
 */

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return prefix + latest.toFixed(decimals) + suffix;
  });
  const nodeRef = useRef();

  useEffect(() => {
    const controls = animate(count, value, { 
      duration,
      ease: 'easeOut'
    });

    return controls.stop;
  }, [value, duration, count]);

  return (
    <motion.span 
      ref={nodeRef}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span>{rounded}</motion.span>
    </motion.span>
  );
};

export default AnimatedCounter;
