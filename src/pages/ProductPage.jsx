// src/pages/ProductPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug, getMyEnrollment, getEbookDownloadUrl } from '../api/services';
import { useAuth, useCart, toast } from '../context';
import { Button, Badge, Skeleton } from '../components/ui';
import ProductCover from '../components/courses/ProductCover';
import Icon from '../components/ui/Icon';
import SEO from '../components/layout/SEO';
import { fmt$, fmtN, disc, hasDiscount, priceLabel, plural } from '../utils/helpers';

export default function ProductPage() {
  const { slug } = useParams();
  const nav      = useNavigate();
  const { user } = useAuth();
  const { addItem, isInCart } = useCart();
  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [owned, setOwned]         = useState(null);   // enrollment row when the user has bought it
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true); setError(null);
    getProductBySlug(slug)
      .then(p => { setProduct(p); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [slug]);

  // Re-check ownership once Firebase has restored the session
  useEffect(() => {
    setOwned(null);
    if (product?.id && user?.id) getMyEnrollment(product.id).then(setOwned);
  }, [product?.id, user?.id]);

  if (loading) return (
    <div className="page" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        <div style={{ flex: '999 1 560px' }}><Skeleton w="100%" h={320} r={18} /><div style={{ marginTop: 24 }}><Skeleton w="70%" h={36} r={6} /></div></div>
        <div style={{ flex: '1 1 320px' }}><Skeleton w="100%" h={360} r={18} /></div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <SEO title="Not Found" noIndex />
      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Product not found</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>{error || 'This product does not exist or has been removed.'}</p>
      <Button variant="primary" onClick={() => nav(-1)}>← Go back</Button>
    </div>
  );

  const isEbook = product.type === 'ebook';
  const inCart  = isInCart(product.id);
  const onSale  = hasDiscount(product);
  const sections = (product.curriculum ?? []).filter(s => s.title?.trim());
  const lectureCount = sections.reduce((n, s) => n + (s.lectures?.filter(l => l.title?.trim()).length ?? 0), 0);

  const facts = isEbook
    ? [product.pages ? `${product.pages} pages` : null, product.format, product.language, 'Lifetime access']
    : [product.duration, product.lessons ? plural(product.lessons, 'lesson') : null, product.level, product.language, 'Lifetime access'];

  const includes = isEbook
    ? [['download', 'Instant download after payment'], ['file', `${product.format || 'PDF'} — read on any device`], ['refund', '30-day money-back guarantee'], ['lock', 'Secure checkout']]
    : [['infinity', 'Lifetime access'], ['layers', 'Watch on mobile and desktop'], ['refund', '30-day money-back guarantee'], ['lock', 'Secure checkout']];

  function addToCart() {
    addItem(product);
    toast.success(`"${product.title}" added to cart!`);
  }
  function buyNow() {
    if (!inCart) addItem(product);
    nav('/checkout');
  }
  async function download() {
    setDownloading(true);
    try { window.location.href = await getEbookDownloadUrl(product.ebookFileUrl, product.title); }
    catch (e) { toast.error(e.message); }
    finally { setDownloading(false); }
  }

  return (
    <main>
      <SEO title={product.title} description={product.description} image={product.image} />

      <div className="page" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: 14, color: 'var(--text2)', flexWrap: 'wrap' }}>
          <Link to={isEbook ? '/ebooks' : '/courses'} style={{ color: 'var(--accent-text)' }}>{isEbook ? 'eBooks' : 'Courses'}</Link>
          {product.category && <><span aria-hidden="true">/</span><Link to={`${isEbook ? '/ebooks' : '/courses'}?cat=${encodeURIComponent(product.category)}`} style={{ color: 'var(--accent-text)' }}>{product.category}</Link></>}
          <span aria-hidden="true">/</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{product.title}</span>
        </nav>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
          {/* ── Left ── */}
          <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <ProductCover product={product} height={340} titleSize={40} rounded={18} />

            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <Badge variant={isEbook ? 'info' : 'accent'}>{isEbook ? 'eBook' : 'Course'}</Badge>
                {product.bestseller && <Badge variant="gold">Bestseller</Badge>}
              </div>
              <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1.12, fontWeight: 600, letterSpacing: '-.5px', marginBottom: 12 }}>{product.title}</h1>
              {product.description && <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>{product.description}</p>}
              <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 18 }}>
                By <strong style={{ color: 'var(--text)' }}>{product.author}</strong>
                {product.lastUpdated && <> · Updated {product.lastUpdated}</>}
                {product.reviewCount > 0 && <> · <span style={{ color: 'var(--gold)' }} aria-hidden="true">★</span> {product.rating.toFixed(1)} ({fmtN(product.reviewCount)} reviews)</>}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {facts.filter(Boolean).map(f => (
                  <span key={f} style={{ fontSize: 14, background: 'var(--bg2)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 10 }}>{f}</span>
                ))}
              </div>
            </div>

            {product.longDescription && (
              <Panel title={isEbook ? 'About this eBook' : 'About this course'}>
                <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{product.longDescription}</p>
              </Panel>
            )}

            {sections.length > 0 && (
              <Panel title={isEbook ? 'What’s inside' : 'Curriculum'}
                aside={isEbook ? plural(sections.length, 'chapter') : `${plural(sections.length, 'section')} · ${plural(lectureCount, 'lecture')}`}>
                {sections.map((s, i) => (
                  <div key={s.id ?? i} style={{ padding: '14px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ width: 30, fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: 'var(--accent-text)' }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{s.title}</span>
                      {s.lectures?.length > 0 && <span style={{ fontSize: 14, color: 'var(--text2)' }}>{plural(s.lectures.length, isEbook ? 'part' : 'lecture')}</span>}
                    </div>
                    {s.lectures?.filter(l => l.title?.trim()).length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '8px 0 0 46px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {s.lectures.filter(l => l.title?.trim()).map((l, j) => (
                          <li key={l.id ?? j} style={{ fontSize: 14, color: 'var(--text2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Icon name={isEbook ? 'file' : 'play'} size={13} color="var(--text3)" />{l.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Panel>
            )}

            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.tags.map(t => (
                  <Link key={t} to={`${isEbook ? '/ebooks' : '/courses'}?q=${encodeURIComponent(t)}`}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px', fontSize: 13, color: 'var(--text2)' }}>
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: buy box, or "in your library" when owned ── */}
          <aside className="buy-box" style={{ flex: '1 1 320px', minWidth: 0, maxWidth: 400, position: 'sticky', top: 'calc(var(--header-h) + 20px)' }}>
            {owned ? (
              <div style={{ background: 'var(--bg2)', border: '1.5px solid var(--success-border)', borderRadius: 18, padding: 26, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={18} stroke={2.6} color="var(--success)" />
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>In your library</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Purchased {new Date(owned.enrolled_at).toLocaleDateString()}</p>
                {isEbook ? (
                  product.ebookFileUrl
                    ? <Button variant="success" size="lg" full loading={downloading} onClick={download}><Icon name="download" size={18} /> Download</Button>
                    : <p style={{ fontSize: 14, color: 'var(--text2)' }}>The author hasn’t uploaded the file yet. It will appear here and in My Courses.</p>
                ) : (
                  <Link to={`/learn/${product.slug}`}><Button variant="success" size="lg" full><Icon name="play" size={16} /> {owned.progress > 0 ? 'Continue learning' : 'Start course'}</Button></Link>
                )}
                {isEbook && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 14, lineHeight: 1.6 }}>Download as often as you like. You’ll also find it in <Link to="/my-courses" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>My Courses</Link>.</p>}
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: 26, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 700 }}>{priceLabel(product.price)}</span>
                  {onSale && <>
                    <span style={{ fontSize: 16, color: 'var(--text3)', textDecoration: 'line-through' }}>{fmt$(product.originalPrice)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#064E3B', background: '#A7F3D0', padding: '3px 8px', borderRadius: 99 }}>−{disc(product.price, product.originalPrice)}%</span>
                  </>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Price in USD · one-time payment</p>
                <Button variant="primary" size="lg" full onClick={buyNow} style={{ marginBottom: 10 }}>
                  {Number(product.price) === 0 ? 'Get it free' : 'Buy now'}
                </Button>
                <Button variant={inCart ? 'success' : 'secondary'} size="lg" full onClick={inCart ? () => nav('/cart') : addToCart}>
                  {inCart ? <><Icon name="check" size={17} /> In cart — view cart</> : <><Icon name="cart" size={17} /> Add to cart</>}
                </Button>
                <ul style={{ listStyle: 'none', marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'var(--text2)' }}>
                  {includes.map(([icon, text]) => (
                    <li key={text} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name={icon} size={18} color="var(--accent)" />{text}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      <style>{`@media (max-width: 960px) { .buy-box { position: static !important; max-width: none !important; } }`}</style>
    </main>
  );
}

function Panel({ title, aside, children }) {
  return (
    <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600 }}>{title}</h2>
        {aside && <span style={{ fontSize: 14, color: 'var(--text2)' }}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}
