import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, PresentationControls } from '@react-three/drei';
import { MessageCircle, X } from 'lucide-react';
import modelUrl from '../glb/contoh.glb?url';
import WayangParallax from '../components/WayangParallax';
import logo from '../asset/Galery/Logo.png';

// Error Boundary to prevent crashes if the 3D model path is wrong
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>
          <p>Karakter 3D tidak ditemukan atau terjadi kesalahan.</p>
          <p style={{ fontSize: '0.8rem', color: '#888' }}>Pastikan file berada di: src/glb/contoh.glb</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// 3D Model Component
function NyaiModel(props) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} {...props} />;
}

const Home = () => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(false);

  const openAssistant = () => {
    setShowOverlay(false);
    window.dispatchEvent(new Event('open-assistant'));
  };

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
          <img src={logo} alt="Logo Sri Baduga" style={{ height: '50px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Elms Sans, sans-serif' }}>
          <Link to="/catalog" style={{ color: 'var(--color-text-muted)' }}>Koleksi</Link>
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
        <Link to="/catalog" className="btn-primary">
          Menjelajah
        </Link>
      </div>

      {/* Overlay Modal */}
      {showOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 999, // Assistant is zIndex 1000 so it will show on top
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '2rem'
        }}>

          {/* Close Button */}
          <button
            onClick={() => setShowOverlay(false)}
            style={{
              position: 'absolute',
              top: '30px',
              right: '40px',
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              zIndex: 1000,
              padding: '10px'
            }}
          >
            <X size={40} />
          </button>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Kalnia',
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textAlign: 'center',
            marginTop: '2rem'
          }}>
            Jelajahi Museum Sri Baduga Bersama NyAI
          </h1>

          {/* Subtitle */}
          <p style={{
            maxWidth: '650px',
            textAlign: 'center',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '2rem',
            color: '#eee'
          }}>
            Sampurasun Selamat datang di Sri Baduga, jelajahi dengan leluasa dan nikmati perjalanan yang nyaman dan berkesan.
          </p>

          {/* Chat Button */}
          <button
            onClick={openAssistant}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '30px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '2rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              transition: 'background 0.3s, transform 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <MessageCircle size={20} />
            Ngobrol dengan NyAI ✨
          </button>

          {/* 3D Character Rendering */}
          <div className="modal-content-box" style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
            <ErrorBoundary>
              <Suspense fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Loading Character...</div>}>
                <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
                  <ambientLight intensity={0.6} />
                  <PresentationControls
                    global
                    rotation={[0, 0, 0]}
                    polar={[-0.1, 0.1]}
                    azimuth={[-0.2, 0.2]}
                    config={{ mass: 2, tension: 400 }}
                    snap={{ mass: 4, tension: 400 }}
                  >
                    {/* Menggunakan Stage untuk pencahayaan studio yang lembut dan alas bayangan (contactShadow) */}
                    <Stage environment="city" intensity={0.6} contactShadow={{ resolution: 1024, scale: 10, blur: 2, opacity: 0.7 }}>
                      <NyaiModel />
                    </Stage>
                  </PresentationControls>
                </Canvas>
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Cookie Consent Box */}
          {!cookieConsent && (
            <div className="cookie-box" style={{
              position: 'absolute',
              backgroundColor: 'white',
              color: 'black',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              zIndex: 1000
            }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6' }}>
                Situs web ini menggunakan cookie untuk meningkatkan pengalaman menjelajah Anda. Dengan terus menggunakan situs ini, Anda menyetujui penggunaan cookie oleh kami. Pelajari lebih lanjut di sini
              </p>
              <button
                onClick={() => setCookieConsent(true)}
                style={{
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              >
                Saya mengerti
              </button>
            </div>
          )}

        </div>
      )}

    </PageTransition>
  );
};

export default Home;
