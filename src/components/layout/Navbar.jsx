// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useTheme, useCart } from '../../context';
import { Button } from '../ui';
import { inits } from '../../utils/helpers';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const { count } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const [dd, setDd]   = useState(false);
  const [mob, setMob] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setDd(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setMob(false); setDd(false); }, [loc.pathname]);

  const links = [
    { to:'/', label:'Home' },
    { to:'/courses', label:'Courses' },
    { to:'/ebooks', label:'eBooks' },
  ];
  const active = to => to==='/' ? loc.pathname==='/' : loc.pathname.startsWith(to);

  function Logo({ height=38, white=false }) {
    return (
      <img
        src={white ? '/logo-white.png' : '/logo.png'}
        alt="EduVault"
        style={{ height, width:'auto', objectFit:'contain', display:'block' }}
        onError={e => {
          if (white) { e.target.src='/logo.png'; e.target.style.filter='brightness(0) invert(1)'; }
        }}
      />
    );
  }

  return (
    <nav style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:200, height:'var(--header-h)', boxShadow:'var(--shadow-sm)' }}>
      <div className="page" style={{ height:'100%', display:'flex', alignItems:'center', gap:16 }}>

        {/* Logo */}
        <Link to="/" style={{ flexShrink:0, display:'flex', alignItems:'center' }}>
          <Logo height={38} />
        </Link>

        {/* Desktop links */}
        <div style={{ flex:1, display:'flex', justifyContent:'center', gap:4 }} className="desktop-nav">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              style={{ padding:'8px 16px', borderRadius:8, fontSize:14, fontWeight:active(l.to)?600:400, color:active(l.to)?'var(--accent)':'var(--text2)', background:active(l.to)?'var(--accent-bg)':'transparent', transition:'all .18s' }}
              onMouseEnter={e=>{ if(!active(l.to)){e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.color='var(--text)';} }}
              onMouseLeave={e=>{ if(!active(l.to)){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text2)';} }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Create button — shown when logged in */}
          {user && (
            <Link to="/create">
              <button style={{ padding:'7px 16px', borderRadius:8, border:'1.5px solid var(--accent)', background:'transparent', color:'var(--accent)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .18s', display:'flex', alignItems:'center', gap:6 }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--accent)';}}>
                + Create
              </button>
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart"
            style={{ position:'relative', width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:9, color:'var(--text2)', fontSize:17, flexShrink:0, transition:'all .18s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.borderColor='var(--accent-border)';e.currentTarget.style.color='var(--accent)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)';}}>
            🛒
            {count>0 && <span style={{ position:'absolute', top:-6, right:-6, background:'var(--accent)', color:'#fff', borderRadius:99, width:18, height:18, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg2)' }}>{count}</span>}
          </Link>

          {/* Theme toggle */}
          <button onClick={toggle} aria-label="Toggle theme"
            style={{ width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:9, fontSize:16, transition:'all .18s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.borderColor='var(--accent-border)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.borderColor='var(--border)';}}>
            {dark?'☀️':'🌙'}
          </button>

          {/* User menu */}
          {user ? (
            <div ref={ref} style={{ position:'relative' }}>
              <button onClick={()=>setDd(d=>!d)}
                style={{ display:'flex', alignItems:'center', gap:9, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:99, padding:'5px 14px 5px 5px', cursor:'pointer', transition:'all .18s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent-border)';e.currentTarget.style.background='var(--accent-bg)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg3)';}}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent2))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{inits(user.name)}</div>
                )}
                <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{user.name.split(' ')[0]}</span>
                <span style={{ fontSize:10, color:'var(--text3)', transition:'transform .2s', display:'inline-block', transform:dd?'rotate(180deg)':'none' }}>▾</span>
              </button>

              {dd && (
                <div className="scale-in" style={{ position:'absolute', right:0, top:46, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:8, minWidth:210, boxShadow:'var(--shadow-lg)', zIndex:300 }}>
                  <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', marginBottom:6 }}>
                    <p style={{ fontSize:13, fontWeight:600 }}>{user.name}</p>
                    <p style={{ fontSize:11, color:'var(--text3)' }}>{user.email}</p>
                  </div>
                  {[
                    isAdmin && { to:'/admin', icon:'🛡', label:'Admin Dashboard' },
                    { to:'/my-courses', icon:'📚', label:'My Courses' },
                    { to:'/create', icon:'✏️', label:'Create Course / eBook' },
                  ].filter(Boolean).map(item => (
                    <Link key={item.to} to={item.to}
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:8, fontSize:13, color:'var(--text2)', transition:'all .15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.color='var(--accent)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text2)';}}>
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop:'1px solid var(--border)', marginTop:6, paddingTop:6 }}>
                    <button onClick={async()=>{await logout();nav('/');}}
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:8, fontSize:13, color:'var(--danger)', background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', transition:'background .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--danger-bg)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      → Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <Button variant="ghost" size="sm" onClick={()=>nav('/login')}>Sign In</Button>
              <Button variant="primary" size="sm" onClick={()=>nav('/signup')}>Get Started</Button>
            </div>
          )}

          <button onClick={()=>setMob(m=>!m)} className="mob-menu-btn"
            style={{ display:'none', width:38, height:38, alignItems:'center', justifyContent:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:9, fontSize:18 }}>
            {mob?'✕':'☰'}
          </button>
        </div>
      </div>

      {mob && (
        <div className="fade-in" style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'12px 16px 20px', boxShadow:'var(--shadow-lg)', zIndex:199 }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{ display:'block', padding:'11px 12px', borderRadius:8, fontSize:15, fontWeight:500, color:active(l.to)?'var(--accent)':'var(--text2)', marginBottom:4, background:active(l.to)?'var(--accent-bg)':'transparent' }}>
              {l.label}
            </Link>
          ))}
          {user && <Link to="/create" style={{ display:'block', padding:'11px 12px', borderRadius:8, fontSize:15, fontWeight:500, color:'var(--accent)', marginBottom:4 }}>+ Create</Link>}
          {!user && (
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <Button variant="secondary" size="md" full onClick={()=>nav('/login')}>Sign In</Button>
              <Button variant="primary" size="md" full onClick={()=>nav('/signup')}>Get Started</Button>
            </div>
          )}
        </div>
      )}

      <style>{`@media(max-width:768px){.desktop-nav{display:none!important}.mob-menu-btn{display:flex!important}}`}</style>
    </nav>
  );
}
