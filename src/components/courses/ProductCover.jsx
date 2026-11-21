// src/components/courses/ProductCover.jsx
// Shows the product's uploaded image; if there is none (or it fails to load),
// draws a cover from the product's colour and title instead of a grey placeholder.
import React, { useState } from 'react';

export default function ProductCover({ product, height = 170, titleSize = 24, rounded = 0, style }) {
  const [failed, setFailed] = useState(false);
  const showImage = product.image && !failed;

  return (
    <div style={{ height, position: 'relative', overflow: 'hidden', borderRadius: rounded, background: product.color || '#1565C0', flexShrink: 0, ...style }}>
      {showImage ? (
        <img src={product.image} alt={product.title} loading="lazy" onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: titleSize, fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.title}
          </span>
        </div>
      )}
    </div>
  );
}
