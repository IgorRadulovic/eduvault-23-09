// src/components/courses/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart, toast } from '../../context';
import ProductCover from './ProductCover';
import Icon from '../ui/Icon';
import { fmt$, fmtN, disc, hasDiscount, priceLabel, productMeta } from '../../utils/helpers';

export default function ProductCard({ product }) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);
  const onSale = hasDiscount(product);
  const meta   = productMeta(product);

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`"${product.title}" added to cart!`);
  }

  return (
    <Link to={`/product/${product.slug}`} style={{ display:'block', height:'100%' }}>
      <article className="product-card"
        style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', height:'100%', display:'flex', flexDirection:'column', cursor:'pointer', transition:'transform .28s var(--ease), box-shadow .28s var(--ease), border-color .28s' }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.borderColor='var(--accent-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor='var(--border)'; }}
      >
        <div style={{ position:'relative' }}>
          <ProductCover product={product} height={175} titleSize={24} />
          <div style={{ position:'absolute', top:12, left:12, right:12, display:'flex', justifyContent:'space-between', gap:8, pointerEvents:'none' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#fff', background:'rgba(13,27,42,.62)', padding:'4px 10px', borderRadius:99 }}>
              <Icon name={product.type==='ebook' ? 'book' : 'play'} size={12} stroke={2.4} />
              {product.type==='ebook' ? 'eBook' : 'Course'}{meta && ` · ${meta}`}
            </span>
            {onSale && (
              <span style={{ fontSize:12, fontWeight:700, color:'#064E3B', background:'#A7F3D0', padding:'4px 10px', borderRadius:99, flexShrink:0 }}>
                −{disc(product.price, product.originalPrice)}%
              </span>
            )}
          </div>
        </div>

        <div style={{ padding:'16px 18px 18px', display:'flex', flexDirection:'column', gap:4, flex:1 }}>
          {product.category && (
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'var(--accent)' }}>{product.category}</p>
          )}
          <h3 style={{ fontSize:16, fontWeight:700, lineHeight:1.35, color:'var(--text)', fontFamily:'inherit' }}>{product.title}</h3>
          <p style={{ fontSize:13, color:'var(--text2)' }}>
            {product.author}{product.type==='course' && product.level ? ` · ${product.level}` : ''}
          </p>

          {product.reviewCount > 0 && (
            <p style={{ fontSize:13, color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'var(--gold)' }} aria-hidden="true">★</span>
              <strong style={{ color:'var(--text)' }}>{product.rating.toFixed(1)}</strong>
              <span>({fmtN(product.reviewCount)})</span>
            </p>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:'auto', paddingTop:12 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
              <span style={{ fontSize:20, fontWeight:700, color:'var(--text)' }}>{priceLabel(product.price)}</span>
              {onSale && <span style={{ fontSize:13, color:'var(--text3)', textDecoration:'line-through' }}>{fmt$(product.originalPrice)}</span>}
            </div>
            <button type="button" onClick={handleAdd} aria-label={inCart ? 'In cart' : `Add ${product.title} to cart`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, height:38, padding:'0 14px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer',
                background: inCart ? 'var(--success-bg)' : 'var(--accent)', color: inCart ? 'var(--success)' : '#fff',
                border: inCart ? '1px solid var(--success-border)' : 'none' }}>
              <Icon name={inCart ? 'check' : 'cart'} size={15} />
              {inCart ? 'In cart' : 'Add'}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
