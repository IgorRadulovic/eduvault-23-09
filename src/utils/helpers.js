// src/utils/helpers.js
export const fmt$  = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0 }).format(n);
export const fmtN  = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n);
export const disc  = (p, op) => Math.round((1 - p / op) * 100);
export const inits = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const slug  = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const trunc = (s, n = 90) => s.length > n ? s.slice(0, n - 1) + '…' : s;
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Pricing display: a discount only counts when the original price is really higher.
export const hasDiscount = (p) => Number(p.originalPrice) > Number(p.price) && Number(p.price) >= 0;
export const priceLabel  = (n) => Number(n) === 0 ? 'Free' : fmt$(n);
// "4h · 38 lessons" for courses, "PDF · 240 pages" for ebooks
export const productMeta = (p) => p.type === 'ebook'
  ? [p.format, p.pages ? `${p.pages} pages` : ''].filter(Boolean).join(' · ')
  : [p.duration, p.lessons ? `${p.lessons} lessons` : ''].filter(Boolean).join(' · ');
export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
