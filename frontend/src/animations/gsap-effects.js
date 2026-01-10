/**
 * GSAP Custom Effects and Utilities
 * Complex timeline-based animations
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Animate text reveal with split effect
 */
export const textRevealEffect = (element, options = {}) => {
  const defaults = {
    duration: 1,
    stagger: 0.05,
    ease: 'power3.out',
    delay: 0
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.from(element, {
    opacity: 0,
    y: 50,
    duration: config.duration,
    stagger: config.stagger,
    ease: config.ease,
    delay: config.delay
  });
};

/**
 * Stagger fade in for multiple elements
 */
export const staggerFadeIn = (elements, options = {}) => {
  const defaults = {
    duration: 0.8,
    stagger: 0.1,
    y: 30,
    opacity: 0,
    ease: 'power2.out'
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.from(elements, {
    opacity: config.opacity,
    y: config.y,
    duration: config.duration,
    stagger: config.stagger,
    ease: config.ease
  });
};

/**
 * Number counter animation
 */
export const animateCounter = (element, endValue, options = {}) => {
  const defaults = {
    duration: 2,
    ease: 'power1.inOut',
    onUpdate: null
  };
  
  const config = { ...defaults, ...options };
  
  const obj = { value: 0 };
  
  return gsap.to(obj, {
    value: endValue,
    duration: config.duration,
    ease: config.ease,
    onUpdate: () => {
      if (element) {
        element.textContent = Math.round(obj.value);
      }
      if (config.onUpdate) {
        config.onUpdate(obj.value);
      }
    }
  });
};

/**
 * Progress bar fill animation
 */
export const progressBarFill = (element, targetWidth, options = {}) => {
  const defaults = {
    duration: 1.5,
    ease: 'power2.out',
    delay: 0
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.to(element, {
    width: targetWidth,
    duration: config.duration,
    ease: config.ease,
    delay: config.delay
  });
};

/**
 * Card flip effect
 */
export const cardFlip = (element, options = {}) => {
  const defaults = {
    duration: 0.6,
    ease: 'power2.inOut'
  };
  
  const config = { ...defaults, ...options };
  
  const timeline = gsap.timeline();
  
  timeline
    .to(element, {
      rotateY: 90,
      duration: config.duration / 2,
      ease: config.ease
    })
    .set(element, { rotateY: -90 })
    .to(element, {
      rotateY: 0,
      duration: config.duration / 2,
      ease: config.ease
    });
  
  return timeline;
};

/**
 * Parallax scroll effect
 */
export const parallaxScroll = (element, options = {}) => {
  const defaults = {
    yPercent: -30,
    ease: 'none',
    scrub: 1
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.to(element, {
    yPercent: config.yPercent,
    ease: config.ease,
    scrollTrigger: {
      trigger: element,
      scrub: config.scrub,
      start: 'top bottom',
      end: 'bottom top'
    }
  });
};

/**
 * Fade and scale on scroll
 */
export const fadeScaleOnScroll = (elements, options = {}) => {
  const defaults = {
    duration: 0.8,
    scale: 0.95,
    opacity: 0,
    stagger: 0.2
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.from(elements, {
    opacity: config.opacity,
    scale: config.scale,
    duration: config.duration,
    stagger: config.stagger,
    scrollTrigger: {
      trigger: elements[0],
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });
};

/**
 * Typing effect animation
 */
export const typingEffect = (element, text, options = {}) => {
  const defaults = {
    duration: 0.05,
    ease: 'none'
  };
  
  const config = { ...defaults, ...options };
  
  element.textContent = '';
  const chars = text.split('');
  const timeline = gsap.timeline();
  
  chars.forEach((char, i) => {
    timeline.call(() => {
      element.textContent += char;
    }, null, i * config.duration);
  });
  
  return timeline;
};

/**
 * Glitch effect
 */
export const glitchEffect = (element, options = {}) => {
  const defaults = {
    duration: 0.1,
    repeat: 5,
    repeatDelay: 0.1
  };
  
  const config = { ...defaults, ...options };
  
  const timeline = gsap.timeline();
  
  for (let i = 0; i < config.repeat; i++) {
    timeline
      .to(element, {
        x: gsap.utils.random(-5, 5),
        y: gsap.utils.random(-5, 5),
        duration: config.duration
      })
      .to(element, {
        x: 0,
        y: 0,
        duration: config.duration
      });
  }
  
  return timeline;
};

/**
 * Morph shape animation
 */
export const morphShape = (element, pathData, options = {}) => {
  const defaults = {
    duration: 1,
    ease: 'power2.inOut'
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.to(element, {
    attr: { d: pathData },
    duration: config.duration,
    ease: config.ease
  });
};

/**
 * Create animation timeline for complex sequences
 */
export const createTimeline = (options = {}) => {
  return gsap.timeline(options);
};

/**
 * Kill all ScrollTrigger instances
 */
export const killScrollTriggers = () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
};

/**
 * Refresh ScrollTrigger (call after DOM changes)
 */
export const refreshScrollTrigger = () => {
  ScrollTrigger.refresh();
};
