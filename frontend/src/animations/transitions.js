/**
 * Framer Motion Transition Variants
 * Reusable animation configurations for consistent UX
 */

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

// Slide transitions
export const slideVariants = {
  left: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 }
  },
  right: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  },
  up: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 }
  },
  down: {
    initial: { opacity: 0, y: -100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 100 }
  }
};

// Stagger children animation
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

// Card hover effects
export const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// Number counter animation
export const counterVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

// Scale fade
export const scaleFadeVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

// Modal variants
export const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2
    }
  }
};

// Backdrop variants
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Spring configuration presets
export const springConfigs = {
  gentle: { type: 'spring', stiffness: 100, damping: 15 },
  bouncy: { type: 'spring', stiffness: 300, damping: 10 },
  snappy: { type: 'spring', stiffness: 400, damping: 25 },
  slow: { type: 'spring', stiffness: 50, damping: 20 }
};

// Easing functions
export const easings = {
  easeInOut: [0.6, -0.05, 0.01, 0.99],
  easeOut: [0.22, 1, 0.36, 1],
  easeIn: [0.12, 0, 0.39, 0],
  smooth: [0.43, 0.13, 0.23, 0.96]
};
