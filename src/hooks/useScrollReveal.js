// src/hooks/useScrollReveal.js
import { useEffect, useRef } from 'react';

const OBS_OPTIONS = { threshold: 0.1, rootMargin: '0px 0px -44px 0px' };

function noMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Attach to a single element: const ref = useScrollReveal() */
export function useScrollReveal(variant = 'reveal', options = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add(variant);
    if (noMotion()) { el.classList.add('revealed'); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      });
    }, { ...OBS_OPTIONS, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [variant]);
  return ref;
}

/** Observe an entire container and stagger-reveal its direct children */
export function useStaggerChildren(options = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const children = Array.from(container.children);
    if (noMotion()) {
      children.forEach(c => { c.style.opacity='1'; c.style.transform='none'; });
      return;
    }
    children.forEach((child, i) => {
      child.classList.add('reveal');
      child.style.transitionDelay = `${i * 75}ms`;
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          Array.from(e.target.children).forEach(c => c.classList.add('revealed'));
          obs.unobserve(e.target);
        }
      });
    }, { ...OBS_OPTIONS, ...options });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/**
 * Site-wide: reveals every .reveal / .reveal-left / .reveal-right / .reveal-scale
 * element as it scrolls into view, including ones rendered later (e.g. product
 * cards that appear after data loads). Mount once in App.
 */
export function useAutoReveal() {
  useEffect(() => {
    const SEL = ['reveal', 'reveal-left', 'reveal-right', 'reveal-scale'].map(c => `.${c}:not(.revealed)`).join(',');
    const reveal = el => el.classList.add('revealed');

    if (noMotion() || !('IntersectionObserver' in window)) {
      const all = () => document.querySelectorAll(SEL).forEach(reveal);
      all();
      const mo = new MutationObserver(all);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, OBS_OPTIONS);
    // observe() ignores elements it already watches, so rescanning is cheap
    const scan = () => document.querySelectorAll(SEL).forEach(el => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); };
  }, []);
}
