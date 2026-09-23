// src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const COLS = [
  { title:'Learn', links:[{to:'/courses',l:'All Courses'},{to:'/ebooks',l:'eBooks'},{to:'/courses?cat=Development',l:'Development'},{to:'/courses?cat=Design',l:'Design'},{to:'/courses?cat=Business',l:'Business'}] },
  { title:'Company', links:[{to:'#',l:'About Us'},{to:'#',l:'Blog'},{to:'#',l:'Careers'},{to:'#',l:'Press'}] },
  { title:'Support', links:[{to:'#',l:'Help Centre'},{to:'#',l:'Contact Us'},{to:'#',l:'Privacy Policy'},{to:'#',l:'Terms of Service'}] },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background:'var(--navy)', color:'rgba(255,255,255,.8)' }}>
      {/* Top wave */}
      <div style={{ background:'var(--bg)', lineHeight:0 }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%' }}>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="var(--navy)" />
        </svg>
      </div>

      <div className="page" style={{ padding:'56px 24px 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1fr', gap:40, marginBottom:52 }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ display:'inline-block', marginBottom:18 }}>
              {/* White version of logo for dark background */}
              <img src="/logo-white.png" alt="EduVault"
                style={{ height:44, width:'auto', objectFit:'contain' }}
                onError={e => {
                  // Fallback: colored logo with filter
                  e.target.src='/logo.png';
                  e.target.style.filter='brightness(0) invert(1)';
                }}
              />
            </Link>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.58)', lineHeight:1.75, maxWidth:280, marginBottom:24 }}>
              Premium courses and ebooks curated by world-class experts. Learn skills that matter, at your own pace.
            </p>
            {/* Social icons */}
            <div style={{ display:'flex', gap:10 }}>
              {[
                { icon:'𝕏', href:'#' },
                { icon:'in', href:'#' },
                { icon:'▶', href:'#' },
                { icon:'f', href:'#' },
              ].map(s => (
                <a key={s.icon} href={s.href}
                  style={{ width:36, height:36, background:'rgba(255,255,255,.1)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'rgba(255,255,255,.7)', transition:'all .2s', textDecoration:'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.1)'; e.currentTarget.style.color='rgba(255,255,255,.7)'; }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:18, fontFamily:'DM Sans,sans-serif' }}>
                {col.title}
              </h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:11 }}>
                {col.links.map(l => (
                  <li key={l.l}>
                    <Link to={l.to}
                      style={{ fontSize:14, color:'rgba(255,255,255,.65)', transition:'color .15s' }}
                      onMouseEnter={e => e.currentTarget.style.color='#fff'}
                      onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,.65)'}>
                      {l.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:28, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>© {year} EduVault. All rights reserved.</p>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ display:'flex', gap:8 }}>
              {['Visa','Mastercard','PayPal','Stripe'].map(p => (
                <span key={p} style={{ fontSize:11, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:5, padding:'3px 8px', color:'rgba(255,255,255,.5)' }}>{p}</span>
              ))}
            </div>
            <span style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>🔒 Secure</span>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){footer .page>div:first-child{grid-template-columns:1fr 1fr!important}}
        @media(max-width:540px){footer .page>div:first-child{grid-template-columns:1fr!important}}
      `}</style>
    </footer>
  );
}
