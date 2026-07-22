'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Apply GSAP scroll-triggered fade-in animation to elements matching the selector.
 * Elements animate in with opacity 0 -> 1 and y: 20 -> 0 as they scroll into view.
 * Respects `prefers-reduced-motion`.
 */
export function useGSAPScrollAnimation(
  selector: string,
  options?: {
    stagger?: number;
    threshold?: number;
  }
) {
  const { stagger = 0.08, threshold = 0.15 } = options || {};

  useEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    // Store references to our triggers so cleanup only kills our own
    const triggers: ScrollTrigger[] = [];

    // Apply fade-in animation with stagger
    elements.forEach((el, i) => {
      const tl = gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: i * stagger,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: `top+=${threshold * 100}% bottom`,
            toggleActions: 'play none none none',
          },
        }
      );
      // Collect all ScrollTrigger instances from this timeline
      if (tl.scrollTrigger) {
        triggers.push(tl.scrollTrigger as ScrollTrigger);
      }
    });

    return () => {
      // Only kill our own triggers, not all ScrollTrigger instances
      triggers.forEach((st) => st.kill());
    };
  }, [selector, stagger, threshold]);
}
