// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/services';
import { useAuth } from '../context';
import ProductCard from '../components/courses/ProductCard';
import ProductCover from '../components/courses/ProductCover';
import Icon from '../components/ui/Icon';
import { Spinner } from '../components/ui';
import SEO from '../components/layout/SEO';
import { priceLabel, productMeta } from '../utils/helpers';

const TOPICS = ['Development', 'Design', 'Business', 'Data Science', 'Marketing', 'Productivity'];

const PROMISES = ['Lifetime access', 'Instant eBook download', '30-day refund', 'Secure checkout'];

const STEPS = [
  { title: 'Pick a course or eBook', text: 'Look through the curriculum or table of contents before you buy.' },
  { title: 'Pay once, securely',     text: 'One payment, no subscription and no hidden fees.' },
  { title: 'Start right away',       text: 'Courses open instantly; eBooks download as PDF or ePub from My Courses.' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [ebooks, setEbooks]   = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProducts({ type: 'ebook', limit: 4, sort: 'newest' }),
      getProducts({ type: 'course', limit: 6 }),
    ])
      .then(([e, c]) => { setEbooks(e.products); setCourses(c.products); })
      .finally(() => setLoading(false));
  }, []);

  // Hero showcase: one course and one eBook when available
  const showcase = [courses[0], ebooks[0]].filter(Boolean);

  return (
    <main>
      <SEO />

      {/* ── Hero ── */}
      <section style={{ background: 'var(--navy)', color: '#fff' }}>
        <div className="page" style={{ padding: '80px 24px 88px', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
          <div style={{ flex: '1 1 460px', minWidth: 0 }}>
            <p className="fade-up" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#90B8E8', marginBottom: 18 }}>
              Video courses &amp; downloadable eBooks
            </p>
            <h1 className="fade-up" style={{ fontSize: 'clamp(38px, 5.4vw, 58px)', lineHeight: 1.05, fontWeight: 600, letterSpacing: '-1px', marginBottom: 20, color: '#fff', animationDelay: '.08s' }}>
              Learn a skill this week.<br />Keep it for life.
            </h1>
            <p className="fade-up" style={{ fontSize: 18, lineHeight: 1.65, color: '#C9D7E8', maxWidth: 520, marginBottom: 32, animationDelay: '.16s' }}>
              Practical courses and eBooks from people who do the work. Buy once, then learn on any device, in any time zone — no subscription.
            </p>
            <div className="fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36, animationDelay: '.24s' }}>
              <Link to="/courses" style={{ height: 52, padding: '0 26px', borderRadius: 12, background: '#fff', color: 'var(--navy)', fontWeight: 700, fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Browse courses <Icon name="arrow" size={18} stroke={2.2} />
              </Link>
              <Link to="/ebooks" style={{ height: 52, padding: '0 26px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,.35)', color: '#fff', fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center' }}>
                Explore eBooks
              </Link>
            </div>
            <ul className="fade-up" style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 24px', maxWidth: 480, fontSize: 15, color: '#DCE6F2', animationDelay: '.32s' }}>
              {PROMISES.map(p => (
                <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(144,184,232,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={16} stroke={2.4} color="#90B8E8" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {showcase.length > 0 && (
            <div className="fade-up hero-showcase" style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 440, animationDelay: '.2s' }}>
              {showcase.map((p, i) => (
                <Link key={p.id} to={`/product/${p.slug}`}
                  style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#fff', color: 'var(--navy)', borderRadius: 16, padding: 12, boxShadow: '0 24px 60px rgba(0,0,0,.35)', marginLeft: i % 2 ? 40 : 0, marginRight: i % 2 ? 0 : 40 }}>
                  <ProductCover product={p} height={96} titleSize={14} rounded={10} style={{ width: 128 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '.5px' }}>{p.type === 'ebook' ? 'eBook' : 'Course'}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</p>
                    <p style={{ fontSize: 13, color: '#4A5E75' }}>{productMeta(p) || p.author}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{priceLabel(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Topics ── */}
      <section className="page reveal" style={{ paddingTop: 56 }}>
        <SectionHead title="Browse by topic" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TOPICS.map(t => (
            <Link key={t} to={`/courses?cat=${encodeURIComponent(t)}`} className="topic-chip"
              style={{ height: 44, padding: '0 18px', borderRadius: 99, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 500, fontSize: 15, display: 'inline-flex', alignItems: 'center' }}>
              {t}
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={36} /></div>
      ) : (
        <>
          {ebooks.length > 0 && (
            <section className="page reveal" style={{ paddingTop: 56 }}>
              <SectionHead title="New eBooks" link="/ebooks" linkLabel="See all eBooks" />
              <Grid items={ebooks} />
            </section>
          )}
          {courses.length > 0 && (
            <section className="page reveal" style={{ paddingTop: 56 }}>
              <SectionHead title="Popular courses" link="/courses" linkLabel="See all courses" />
              <Grid items={courses} />
            </section>
          )}
        </>
      )}

      {/* ── How it works ── */}
      <section className="page reveal" style={{ paddingTop: 64 }}>
        <SectionHead title="How it works" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{i + 1}</span>
              <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.title}</p>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Creator CTA ── */}
      <section className="page reveal" style={{ paddingTop: 64, paddingBottom: 80 }}>
        <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 22, padding: 'clamp(28px, 5vw, 48px)', display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <h2 style={{ fontSize: 34, fontWeight: 600, marginBottom: 10, color: '#fff' }}>Have something worth teaching?</h2>
            <p style={{ fontSize: 17, color: '#DCE8F7', maxWidth: 560 }}>Publish a course or an eBook on EduVault and sell it to learners worldwide. We handle checkout, delivery and downloads.</p>
          </div>
          <Link to={user ? '/create' : '/signup'} style={{ height: 52, padding: '0 26px', borderRadius: 12, background: '#fff', color: 'var(--navy)', fontWeight: 700, fontSize: 16, display: 'inline-flex', alignItems: 'center' }}>
            Start creating
          </Link>
        </div>
      </section>

      <style>{`
        .topic-chip:hover { border-color: var(--accent-border) !important; color: var(--accent) !important; }
        @media (max-width: 860px) { .hero-showcase { display: none !important; } }
      `}</style>
    </main>
  );
}

function SectionHead({ title, link, linkLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
      <h2 style={{ fontSize: 30, fontWeight: 600 }}>{title}</h2>
      {link && <Link to={link} style={{ fontWeight: 600, fontSize: 15, color: 'var(--accent)' }}>{linkLabel}</Link>}
    </div>
  );
}

function Grid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 24 }}>
      {items.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
