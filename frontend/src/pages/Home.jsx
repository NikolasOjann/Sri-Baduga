import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';

const Home = () => {
  return (
    <PageTransition style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(194, 178, 128, 0.2) 0%, rgba(194,178,128,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Navigation */}
      <nav style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ fontFamily: 'Kalnia', fontSize: '1.5rem', color: 'var(--color-text)', fontWeight: 'bold' }}>
          Sri Baduga
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Elms Sans, sans-serif' }}>
          <Link to="/about" style={{ color: 'var(--color-text-muted)' }}>Tentang</Link>
          <Link to="/catalog" style={{ color: 'var(--color-text-muted)' }}>Koleksi</Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, textAlign: 'center', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--color-text-muted)', marginBottom: '1rem', fontFamily: 'Elms Sans, sans-serif' }}>
          Jelajahi Sejarah Jawa Barat
        </h2>
        <h1 style={{ fontSize: '5vw', lineHeight: '1.1', marginBottom: '3rem', fontFamily: 'Kalnia' }}>
          Museum<br/>Sri Baduga
        </h1>
        <Link to="/about" className="btn-primary">
          Menjelajah
        </Link>
      </div>

    </PageTransition>
  );
};

export default Home;
