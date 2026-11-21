// src/components/ui/Icon.jsx
// Small inline line-icon set. Decorative by default (aria-hidden); pass a label for meaningful icons.
import React from 'react';

const PATHS = {
  check:    <path d="M5 12.5l4.5 4.5L19 7.5" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  cart:     <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6" /></>,
  search:   <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  globe:    <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  play:     <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  lock:     <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  refund:   <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  file:     <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  book:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  arrow:    <path d="M5 12h14M13 6l6 6-6 6" />,
  infinity: <path d="M18.2 8.5a4.5 4.5 0 1 1 0 7c-2.6-2-3.8-3.5-6.2-3.5s-3.6 1.5-6.2 3.5a4.5 4.5 0 1 1 0-7c2.6 2 3.8 3.5 6.2 3.5s3.6-1.5 6.2-3.5z" />,
  clock:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  layers:   <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  user:     <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  filter:   <path d="M4 6h16M7 12h10M10 18h4" />,
  sun:      <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon:     <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  menu:     <path d="M4 7h16M4 12h16M4 17h16" />,
  close:    <path d="M6 6l12 12M18 6 6 18" />,
  shield:   <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />,
  plus:     <path d="M12 5v14M5 12h14" />,
  logout:   <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
};

export default function Icon({ name, size = 18, stroke = 2, color = 'currentColor', label, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {PATHS[name]}
    </svg>
  );
}
