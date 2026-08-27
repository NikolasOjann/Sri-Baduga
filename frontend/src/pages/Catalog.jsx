import React, { useState, useEffect, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Globe, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import bgImage from '../asset/Galery/Background-12.png';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, PresentationControls } from '@react-three/drei';
import modelUrl from '../glb/contoh.glb?url';

const API_BASE = import.meta.env.VITE_API_BASE_URL || ('http://' + window.location.hostname + ':3001');

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

const categories = [
  { id: 1, nameKey: 'geologika', name: 'Geologika', descKey: 'geologikaDesc', img: '/category-images/geologika.png' },
  { id: 2, nameKey: 'biologika', name: 'Biologika', descKey: 'biologikaDesc', img: '/category-images/biologika.png' },
  { id: 3, nameKey: 'etnografika', name: 'Etnografika', descKey: 'etnografikaDesc', img: '/category-images/etnografika.png' },
  { id: 4, nameKey: 'arkeologika', name: 'Arkeologika', descKey: 'arkeologikaDesc', img: '/category-images/arkeologika.png' },
  { id: 5, nameKey: 'historika', name: 'Historika', descKey: 'historikaDesc', img: '/category-images/historika.png' },
  { id: 6, nameKey: 'numismatika', name: 'Numismatika', descKey: 'numismatikaDesc', img: '/category-images/numismatika.png' },
  { id: 7, nameKey: 'filologika', name: 'Filologika', descKey: 'filologikaDesc', img: '/category-images/filologika.png' },
  { id: 8, nameKey: 'keramologika', name: 'Keramologika', descKey: 'keramologikaDesc', img: '/category-images/keramologika.png' },
  { id: 9, nameKey: 'seniRupa', name: 'Seni Rupa', descKey: 'seniRupaDesc', img: '/category-images/senirupa.png' },
  { id: 10, nameKey: 'teknologika', name: 'Teknologika', descKey: 'teknologikaDesc', img: '/category-images/teknologika.png' }
];

const Catalog = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const [counts, setCounts] = useState({});
  const [showOverlay, setShowOverlay] = useState(() => {
    return location.state?.fromHome === true;
  });
  const [cookieConsent, setCookieConsent] = useState(() => {
    return localStorage.getItem('cookieConsentAccepted') === 'true';
  });

  const openAssistant = () => {
    setShowOverlay(false);
    window.dispatchEvent(new Event('open-assistant'));
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    window.dispatchEvent(new Event('catalog-overlay-closed'));
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/collections/stats/counts`)
      .then(res => res.json())
      .then(data => setCounts(data || {}))
      .catch(() => setCounts({}));
  }, []);

  useEffect(() => {
    if (showOverlay) {
      window.dispatchEvent(new Event('hide-assistant'));
    } else {
      window.dispatchEvent(new Event('show-assistant'));
    }
    return () => {
      window.dispatchEvent(new Event('show-assistant'));
    };
  }, [showOverlay]);

  return (
    <PageTransition style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>

      <nav className="nav-padding" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={20} /> {t('back')}
        </Link>
        <div style={{ fontFamily: 'Kalnia', fontSize: '1.2rem', color: 'var(--color-text)' }}>
          {t('catalogTitle')}
        </div>
        <button
          onClick={toggleLanguage}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--color-text)', border: '1px solid var(--color-stone-dark)', padding: '0.5rem 1rem', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-ecru-light)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          <Globe size={16} /> {language === 'id' ? 'EN' : 'ID'}
        </button>
      </nav>

      <div className="container" style={{ flex: 1, paddingBottom: '4rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem' }}>{t('tenClassifications')}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>{t('catalogDesc')}</p>
        </div>

        <div className="catalog-grid">
          {categories.map((cat) => {
            const itemCount = counts[cat.name] || 0;
            return (
              <Link
                key={cat.id}
                to={`/collection/${cat.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  border: '1px solid var(--color-stone-dark)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'var(--color-ecru-light)',
                  backgroundImage: cat.img ? `url(${cat.img})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '180px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-text)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  if (!cat.img) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                  } else {
                    const overlay = e.currentTarget.querySelector('.overlay');
                    if (overlay) overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-stone-dark)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (!cat.img) {
                    e.currentTarget.style.backgroundColor = 'var(--color-ecru-light)';
                  } else {
                    const overlay = e.currentTarget.querySelector('.overlay');
                    if (overlay) overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
                  }
                }}
              >
                {cat.img && (
                  <div className="overlay" style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)', transition: 'background-color 0.3s ease', zIndex: 1
                  }}></div>
                )}

                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    backgroundColor: itemCount > 0 ? 'rgba(46, 125, 50, 0.15)' : 'rgba(0,0,0,0.08)',
                    color: itemCount > 0 ? '#1b5e20' : 'var(--color-text-muted)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    {itemCount} Koleksi
                  </span>
                </div>

                <div style={{ position: 'relative', zIndex: 2, marginTop: '1rem' }}>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: cat.img ? '#fff' : 'var(--color-text)' }}>{t(cat.nameKey)}</h2>
                  <p style={{ color: cat.img ? '#d4d4d4' : 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t(cat.descKey)}</p>
                </div>
              </Link>
            );
          })}
        </div>
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
            onClick={closeOverlay}
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

          {/* Subtitle */}
          <p style={{
            maxWidth: '650px',
            textAlign: 'center',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            <span style={{ color: '#FAF6EF' }}>Wilujeng Sumping di Museum </span>
            <strong style={{ color: '#E5C17A', textShadow: '0 0 20px rgba(229, 193, 122, 0.3)' }}>Sri Baduga</strong>
            <span style={{ color: '#D9D1C5', fontWeight: 400, opacity: 0.9 }}>, Abdi NyAI, asisten virtual yang akan memandu perjalananmu menelusuri 10 klasifikasi peninggalan budaya Jawa Barat</span>
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
                onClick={() => {
                  setCookieConsent(true);
                  localStorage.setItem('cookieConsentAccepted', 'true');
                }}
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

export default Catalog;
