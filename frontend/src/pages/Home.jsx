import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import WayangParallax from '../components/WayangParallax';
import logo from '../asset/gallery/Logo.png';
import logo2 from '../asset/gallery/ITENAS.png';

const Home = () => {

  return (
    <PageTransition style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 2.5D Parallax Background */}
      <WayangParallax />

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
      <nav className="nav-padding" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo2} alt="Itenas" style={{ height: '50px', objectFit: 'contain' }} />
          <img src={logo} alt="Logo Sri Baduga" style={{ height: '60px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Elms Sans, sans-serif' }}>
          <Link to="/catalog" state={{ fromHome: true }} style={{ color: 'var(--color-text-muted)' }}>Koleksi</Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, textAlign: 'center', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--color-text-muted)', marginBottom: '1rem', fontFamily: 'Elms Sans, sans-serif' }}>
          Jelajahi Sejarah Jawa Barat
        </h2>
        <h1 className="hero-title">
          Museum<br />Sri Baduga
        </h1>
        <Link to="/catalog" state={{ fromHome: true }} className="btn-primary">
          Menjelajah
        </Link>
      </div>

    </PageTransition>
  );
};

export default Home;
