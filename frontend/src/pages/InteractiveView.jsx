import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Maximize2, ZoomIn, ZoomOut, RotateCcw, Box, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Center } from '@react-three/drei';
import { useLanguage } from '../i18n/LanguageContext';
import { useTTS } from '../hooks/useTTS';
import { motion, AnimatePresence } from 'framer-motion';

import bg1 from '../asset/Galery/Background-1.png';
import bg4 from '../asset/Galery/Background-4.png';
import bg6 from '../asset/Galery/Background-6.png';
import bg7 from '../asset/Galery/Background-7.png';
import bg8 from '../asset/Galery/Background-8.png';
import bg9 from '../asset/Galery/Background-9.png';

// Dynamic GLTF Loader Component for Real 3D Assets (.glb / .gltf)
function DynamicGLTFModel({ url }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} scale={2.5} />
    </Center>
  );
}

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.url !== this.props.url) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// Dummy 3D Models fallback
const CylinderModel = ({ color }) => (
  <mesh position={[0, 1, 0]} castShadow>
    <cylinderGeometry args={[0.5, 0.8, 2, 32]} />
    <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
  </mesh>
);


const BoxModel = ({ color }) => (
  <mesh position={[0, 1, 0]} castShadow>
    <boxGeometry args={[1.5, 1.5, 1.5]} />
    <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
  </mesh>
);

const SphereModel = ({ color }) => (
  <mesh position={[0, 1, 0]} castShadow>
    <sphereGeometry args={[1, 32, 32]} />
    <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
  </mesh>
);

const dummyArtifacts = [
  {
    id: '1',
    titleKey: 'Kujang Pajajaran',
    desc1Key: 'Senjata tradisional Jawa Barat yang bernilai sakral.',
    desc2Key: 'Mencerminkan ketajaman budi dan perlindungan.',
    materialKey: 'Besi Pamor & Kayu',
    eraKey: 'Abad ke-14 Masehi',
    locationKey: 'Jawa Barat',
    Model: CylinderModel,
    color: '#4a4a44',
    thumbnail: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?auto=format&fit=crop&q=80&w=200'
  }
];

const API_BASE = 'http://localhost:3001';

const InteractiveView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const { speak } = useTTS();

  const [item, setItem] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('image'); // 'image' | '3d'
  const [imageScale, setImageScale] = useState(1);
  const [scrollDir, setScrollDir] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setImageScale(1);

    fetch(`${API_BASE}/api/collections/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setItem(data);
        setLoading(false);
        // Fetch remaining items in same category
        if (data.klasifikasi) {
          fetch(`${API_BASE}/api/collections/kategori/${encodeURIComponent(data.klasifikasi)}`)
            .then(res => res.json())
            .then(catData => {
              setCategoryItems(catData.data || []);
            })
            .catch(() => { });
        }
      })
      .catch(() => {
        // Fallback if not found or dummy
        setItem(null);
        setLoading(false);
      });
  }, [id]);

  const currentIndex = categoryItems.findIndex(x => String(x.id) === String(id));
  const activeArtifact = item || dummyArtifacts[0];

  // Auto-speak penjelasan barang saat halaman berhasil di-load
  useEffect(() => {
    if (!loading && activeArtifact) {
      // Dapatkan teks judul dan deskripsi, atau gunakan dummy teks
      const title = activeArtifact.nama_koleksi || (activeArtifact.titleKey ? t(activeArtifact.titleKey) : '');
      const desc = activeArtifact.deskripsi || (activeArtifact.desc1Key ? t(activeArtifact.desc1Key) : '');

      if (title || desc) {
        // Gabungkan judul dan deskripsi dengan jeda (titik)
        const textToSpeak = `${title}. ${desc}`.trim();

        // Beri jeda sedikit agar jika chatbot sedang menyapa rute interaktif, audionya bisa langsung ditimpa (override)
        const timer = setTimeout(() => {
          speak(textToSpeak, language);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, activeArtifact, speak, t, language]);

  const handleNextItem = () => {
    if (categoryItems.length > 0 && currentIndex >= 0 && currentIndex < categoryItems.length - 1) {
      setScrollDir(1);
      navigate(`/interactive/${categoryItems[currentIndex + 1].id}`);
    }
  };

  const handlePrevItem = () => {
    if (categoryItems.length > 0 && currentIndex > 0) {
      setScrollDir(-1);
      navigate(`/interactive/${categoryItems[currentIndex - 1].id}`);
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '50%' : '-50%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "tween", duration: 0.8, ease: [0.76, 0, 0.24, 1] },
        opacity: { duration: 0.6, ease: "easeOut" },
        scale: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
      }
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '50%' : '-50%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "tween", duration: 0.8, ease: [0.76, 0, 0.24, 1] },
        opacity: { duration: 0.4 },
        scale: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
      }
    })
  };

  const ActiveModel = activeArtifact.Model || CylinderModel;

  const [randomBg] = useState(() => {
    const bgs = [bg1, bg4, bg6, bg7, bg8, bg9];
    return bgs[Math.floor(Math.random() * bgs.length)];
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#C2B280',
        backgroundImage: `url(${randomBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
      ref={containerRef}
    >

      {/* Back Button Overlay */}
      <div className="interactive-back-btn" style={{ position: 'absolute', zIndex: 70, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={() => {
          if (activeArtifact && activeArtifact.klasifikasi) {
            navigate(`/collection/${encodeURIComponent(activeArtifact.klasifikasi)}`);
          } else {
            navigate('/catalog');
          }
        }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', backgroundColor: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.1)', padding: '0.7rem 1.4rem', borderRadius: '30px', cursor: 'pointer', fontWeight: 500, backdropFilter: 'blur(10px)', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.45)'}>
          <ArrowLeft size={16} /> {t('back')}
        </button>

        {/* Mode Toggle Button */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(10px)', borderRadius: '30px', padding: '3px', border: '1px solid rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setViewMode('image')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: '25px', border: 'none',
              backgroundColor: viewMode === 'image' ? '#1a1a1a' : 'transparent',
              color: viewMode === 'image' ? '#fff' : '#1a1a1a',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.3s'
            }}
          >
            <ImageIcon size={14} /> Foto Artefak
          </button>
          <button
            onClick={() => setViewMode('3d')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: '25px', border: 'none',
              backgroundColor: viewMode === '3d' ? '#1a1a1a' : 'transparent',
              color: viewMode === '3d' ? '#fff' : '#1a1a1a',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.3s'
            }}
          >
            <Box size={14} /> Simulasi 3D
            {activeArtifact.model_3d && (
              <span style={{
                backgroundColor: viewMode === '3d' ? '#4caf50' : '#2e7d32',
                color: '#fff',
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: 700
              }}>ASLI</span>
            )}
          </button>
        </div>

        {/* Language Toggle Button */}
        <button onClick={toggleLanguage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', color: '#1a1a1a', backgroundColor: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.45)'}>
          {language === 'id' ? 'EN' : 'ID'}
        </button>
      </div>

      {/* FIXED UI ELEMENTS (OUTSIDE OF ANIMATION) */}

      {/* Slide Arrows */}
      {categoryItems.length > 0 && currentIndex > 0 && (
        <button onClick={handlePrevItem} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 60, width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)'}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </button>
      )}
      {categoryItems.length > 0 && currentIndex < categoryItems.length - 1 && (
        <button onClick={handleNextItem} style={{ position: 'absolute', left: 'calc(55% - 65px)', top: '50%', transform: 'translateY(-50%)', zIndex: 60, width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)'}>
          <ChevronRight size={24} color="#1a1a1a" />
        </button>
      )}

      {/* Progress/Thumbnails Bar (Bottom of Image) */}
      {categoryItems.length > 0 && (
        <div className="thumbnail-bar" style={{ position: 'absolute', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', backgroundColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(15px)', borderRadius: '40px', border: '1px solid rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          {categoryItems.slice(Math.max(0, currentIndex - 5), currentIndex + 6).map((art, idx) => {
            const isSelected = String(art.id) === String(id);
            return (
              <Link
                key={art.id}
                to={`/interactive/${art.id}`}
                onClick={() => {
                  const newIndex = categoryItems.findIndex(x => String(x.id) === String(art.id));
                  setScrollDir(newIndex > currentIndex ? 1 : -1);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isSelected ? 1 : 0.5, transition: 'all 0.3s ease', transform: isSelected ? 'scale(1.08)' : 'scale(1)', textDecoration: 'none'
                }}
              >
                <div style={{ width: '45px', height: '32px', borderRadius: '6px', overflow: 'hidden', boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.25)' : 'none', border: isSelected ? '2px solid #1a1a1a' : '1px solid transparent', backgroundColor: '#ddd' }}>
                  <img src={art.gambar || dummyArtifacts[0].thumbnail} alt={art.nama_koleksi} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <AnimatePresence initial={false} custom={scrollDir}>
        <motion.div
          key={id}
          custom={scrollDir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="interactive-layout"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Left Side: Interactive Image Viewer or 3D Stage */}
          <div className="interactive-left" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            {viewMode === 'image' ? (
              <div style={{ position: 'relative', width: '100%', height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                {activeArtifact.gambar ? (
                  <div style={{
                    overflow: 'hidden',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    maxHeight: '100%',
                    maxWidth: '85%',
                    position: 'relative',
                    border: '4px solid rgba(255,255,255,0.3)',
                    backgroundColor: 'transparent'
                  }}>
                    <img
                      src={activeArtifact.gambar}
                      alt={activeArtifact.nama_koleksi}
                      style={{
                        maxHeight: '60vh',
                        maxWidth: '100%',
                        display: 'block',
                        mixBlendMode: 'lighten',
                        filter: 'contrast(1.06) brightness(1.03)',
                        transform: `scale(${imageScale})`,
                        transition: 'transform 0.3s ease',
                        cursor: imageScale > 1 ? 'grab' : 'zoom-in'
                      }}
                      onClick={() => setImageScale(s => s === 1 ? 1.6 : 1)}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#4a4a44', fontFamily: 'Kalnia', fontSize: '1.5rem' }}>
                    Foto koleksi tidak tersedia
                  </div>
                )}

                {/* Image Zoom Controls Overlay */}
                {activeArtifact.gambar && (
                  <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', padding: '0.4rem', borderRadius: '25px', border: '1px solid rgba(0,0,0,0.1)', zIndex: 10 }}>
                    <button onClick={() => setImageScale(s => Math.min(s + 0.3, 3))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }} title="Zoom In"><ZoomIn size={16} /></button>
                    <button onClick={() => setImageScale(s => Math.max(s - 0.3, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }} title="Zoom Out"><ZoomOut size={16} /></button>
                    <button onClick={() => setImageScale(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }} title="Reset Zoom"><RotateCcw size={16} /></button>
                  </div>
                )}
              </div>
            ) : (
              /* 3D Canvas Mode */
              <>
                <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>

                  <ambientLight intensity={1.5} />
                  <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                  <directionalLight position={[-10, 5, 10]} intensity={1.5} />
                  <directionalLight position={[10, 5, -10]} intensity={1.5} />
                  <directionalLight position={[0, -10, 0]} intensity={0.8} />

                  <Suspense fallback={null}>
                    {activeArtifact.model_3d ? (
                      <ModelErrorBoundary url={activeArtifact.model_3d} fallback={<ActiveModel color={activeArtifact.color || '#4a4a44'} />}>
                        <DynamicGLTFModel url={activeArtifact.model_3d} />
                      </ModelErrorBoundary>
                    ) : (
                      <ActiveModel color={activeArtifact.color || '#4a4a44'} />
                    )}
                    <Environment preset="city" />
                    <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={15} blur={2.5} far={4} color="#000000" />
                  </Suspense>

                  <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.5}
                    autoRotate
                    autoRotateSpeed={0.8}
                  />
                </Canvas>
                <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.78rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)', letterSpacing: '1px' }}>
                  <Info size={14} /> Putar model 3D untuk melihat dari berbagai sudut
                </div>
              </>
            )}
          </div>

          {/* Right Side: Description & Metadata */}
          <div className="interactive-right" style={{ backgroundColor: 'transparent', padding: '6rem 3rem 4rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', zIndex: 10, overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ borderLeft: '1px solid rgba(0,0,0,0.15)', paddingLeft: '2.5rem', position: 'relative' }}>

              <div style={{ position: 'absolute', left: '-1px', top: 0, width: '3px', height: '80px', backgroundColor: '#1a1a1a' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem', color: '#4a4a44', fontWeight: 600 }}>
                  {activeArtifact.klasifikasi || 'Koleksi Museum'}
                </span>
                {activeArtifact.kondisi && (
                  <span style={{
                    backgroundColor: activeArtifact.kondisi.toLowerCase() === 'baik' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(245, 124, 0, 0.2)',
                    color: activeArtifact.kondisi.toLowerCase() === 'baik' ? '#1b5e20' : '#e65100',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {activeArtifact.kondisi}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '2.4rem', marginBottom: '1.2rem', lineHeight: '1.2', color: '#1a1a1a', fontFamily: 'Kalnia', fontWeight: 500 }}>
                {activeArtifact.nama_koleksi || activeArtifact.titleKey}
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#2b2b27', lineHeight: '1.75', fontSize: '1rem' }}>
                <p style={{ margin: 0 }}>
                  {language === 'en'
                    ? (activeArtifact.deskripsi_en || activeArtifact.deskripsi || (activeArtifact.desc1Key && t(activeArtifact.desc1Key)))
                    : (activeArtifact.deskripsi || (activeArtifact.desc1Key && t(activeArtifact.desc1Key)))}
                </p>

                {/* Grid Metadata Lengkap */}
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  {activeArtifact.no_inventarisasi && (
                    <div>
                      <h4 style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.3rem' }}>
                        {language === 'en' ? 'Inventory No.' : 'No. Inventarisasi'}
                      </h4>
                      <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 600, fontFamily: 'monospace' }}>{activeArtifact.no_inventarisasi}</p>
                    </div>
                  )}

                  {activeArtifact.dimensi && activeArtifact.dimensi.panjang && (
                    <div>
                      <h4 style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.3rem' }}>
                        {language === 'en' ? 'Dimension' : 'Dimensi'}
                      </h4>
                      <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>{activeArtifact.dimensi.panjang}</p>
                    </div>
                  )}

                  {activeArtifact.tempat_penyimpanan && (
                    <div>
                      <h4 style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.3rem' }}>
                        {language === 'en' ? 'Storage Location' : 'Tempat Penyimpanan'}
                      </h4>
                      <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>{activeArtifact.tempat_penyimpanan}</p>
                    </div>
                  )}

                  {activeArtifact.tanggal_pengamatan && (
                    <div>
                      <h4 style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.3rem' }}>
                        {language === 'en' ? 'Observation Date' : 'Tanggal Pendataan'}
                      </h4>
                      <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>{activeArtifact.tanggal_pengamatan}</p>
                    </div>
                  )}
                </div>

                {activeArtifact.keterangan && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#555', fontStyle: 'italic' }}>
                    {language === 'en' ? 'Note: ' : 'Catatan: '} {activeArtifact.keterangan}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveView;
