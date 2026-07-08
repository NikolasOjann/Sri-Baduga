import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Info } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useLanguage } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

// Dummy 3D Models
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
    titleKey: 'kujangTitle',
    desc1Key: 'kujangDesc1',
    desc2Key: 'kujangDesc2',
    materialKey: 'materialValue',
    eraKey: 'eraValue',
    locationKey: 'locationValue',
    Model: CylinderModel,
    color: '#4a4a44',
    thumbnail: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '2',
    titleKey: 'Prasasti Batu',
    desc1Key: 'Prasasti kuno peninggalan kerajaan Tarumanegara.',
    desc2Key: 'Mencatat silsilah raja-raja dan kejadian penting masa itu.',
    materialKey: 'Batu Andesit',
    eraKey: 'Abad ke-5 Masehi',
    locationKey: 'Bogor',
    Model: BoxModel,
    color: '#8b8c89',
    thumbnail: 'https://images.unsplash.com/photo-1549429731-f11100236de9?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '3',
    titleKey: 'Mahkota Binokasih',
    desc1Key: 'Mahkota emas peninggalan kerajaan Sunda.',
    desc2Key: 'Simbol kekuasaan tertinggi yang diserahkan kepada Prabu Geusan Ulun.',
    materialKey: 'Emas',
    eraKey: 'Abad ke-16 Masehi',
    locationKey: 'Sumedang',
    Model: SphereModel,
    color: '#d4af37',
    thumbnail: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&q=80&w=200'
  }
];

const InteractiveView = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  
  const initialIndex = dummyArtifacts.findIndex(a => a.id === id);
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [scrollDir, setScrollDir] = useState(1);
  const containerRef = useRef(null);

  const activeArtifact = dummyArtifacts[activeIndex];
  const ActiveModel = activeArtifact.Model;

  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30 || Math.abs(e.deltaX) > 30) {
        if (e.deltaY > 0 || e.deltaX > 0) {
          setScrollDir(1);
          setActiveIndex(prev => Math.min(prev + 1, dummyArtifacts.length - 1));
        } else {
          setScrollDir(-1);
          setActiveIndex(prev => Math.max(prev - 1, 0));
        }
      }
    };

    let timeout;
    const wheelListener = (e) => {
      if (timeout) return;
      handleWheel(e);
      timeout = setTimeout(() => { timeout = null; }, 1000); 
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', wheelListener, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', wheelListener);
      }
      clearTimeout(timeout);
    };
  }, []);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 100, damping: 20 },
        opacity: { duration: 0.4 }
      }
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 100, damping: 20 },
        opacity: { duration: 0.4 }
      }
    })
  };

  return (
    <PageTransition style={{ height: '100vh', width: '100vw', display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: '#C2B280' }} ref={containerRef}>

      {/* Back Button Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, padding: '2rem 3rem', zIndex: 50 }}>
        <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', padding: '0.8rem 1.5rem', borderRadius: '30px', cursor: 'pointer', fontWeight: 500, backdropFilter: 'blur(10px)', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}>
          <ArrowLeft size={16} /> {t('back')}
        </button>
      </div>

      {/* Progress/Thumbnails Bar (Bottom) */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(15px)', borderRadius: '40px', border: '1px solid rgba(0,0,0,0.05)' }}>
        {dummyArtifacts.map((art, idx) => (
          <div 
            key={art.id} 
            onClick={() => {
              setScrollDir(idx > activeIndex ? 1 : -1);
              setActiveIndex(idx);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              opacity: activeIndex === idx ? 1 : 0.4,
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: activeIndex === idx ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <div style={{
              width: '50px',
              height: '35px',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: activeIndex === idx ? '0 5px 15px rgba(0,0,0,0.2)' : 'none',
              border: activeIndex === idx ? '1px solid rgba(0,0,0,0.3)' : '1px solid transparent',
            }}>
              <img src={art.thumbnail} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ color: '#1a1a1a', fontWeight: activeIndex === idx ? 600 : 400, fontSize: '0.8rem', fontFamily: 'monospace' }}>
              0{idx + 1}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false} custom={scrollDir}>
        <motion.div
          key={activeIndex}
          custom={scrollDir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ width: '100%', height: '100%', display: 'flex', position: 'absolute', top: 0, left: 0 }}
        >
          {/* 3D Canvas (Left Side) */}
          <div style={{ flex: '0 0 60%', height: '100%', position: 'relative' }}>
            <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
              <color attach="background" args={['#C2B280']} />
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

              <Suspense fallback={null}>
                <ActiveModel color={activeArtifact.color} />
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
            <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', backgroundColor: 'rgba(255, 255, 255, 0.3)', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.8rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)', letterSpacing: '1px' }}>
              <Info size={14} /> {t('rotationInfo')}
            </div>
          </div>

          {/* Description (Right Side) */}
          <div style={{ flex: '0 0 40%', height: '100%', backgroundColor: '#C2B280', padding: '6rem 4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '3rem', position: 'relative' }}>
              
              {/* Decorative line */}
              <div style={{ position: 'absolute', left: '-1px', top: 0, width: '2px', height: '100px', backgroundColor: '#1a1a1a' }}></div>

              <span style={{ textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.75rem', color: '#4a4a44', marginBottom: '1.5rem', display: 'block' }}>
                {t('artifactCollection')} / 0{activeIndex + 1}
              </span>
              
              <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', lineHeight: '1.1', color: '#1a1a1a', fontFamily: 'Kalnia', fontWeight: 500 }}>
                {t(activeArtifact.titleKey) !== activeArtifact.titleKey ? t(activeArtifact.titleKey) : activeArtifact.titleKey} {activeArtifact.id === '1' ? id : ''}
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#333', lineHeight: '1.8', fontSize: '1.1rem', fontWeight: 400 }}>
                <p>{t(activeArtifact.desc1Key) !== activeArtifact.desc1Key ? t(activeArtifact.desc1Key) : activeArtifact.desc1Key}</p>
                <p>{t(activeArtifact.desc2Key) !== activeArtifact.desc2Key ? t(activeArtifact.desc2Key) : activeArtifact.desc2Key}</p>

                <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ color: '#1a1a1a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{t('material')}</h4>
                    <p style={{ margin: 0, color: '#4a4a44', fontSize: '0.95rem' }}>{t(activeArtifact.materialKey) !== activeArtifact.materialKey ? t(activeArtifact.materialKey) : activeArtifact.materialKey}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#1a1a1a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{t('era')}</h4>
                    <p style={{ margin: 0, color: '#4a4a44', fontSize: '0.95rem' }}>{t(activeArtifact.eraKey) !== activeArtifact.eraKey ? t(activeArtifact.eraKey) : activeArtifact.eraKey}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#1a1a1a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{t('location')}</h4>
                    <p style={{ margin: 0, color: '#4a4a44', fontSize: '0.95rem' }}>{t(activeArtifact.locationKey) !== activeArtifact.locationKey ? t(activeArtifact.locationKey) : activeArtifact.locationKey}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </PageTransition>
  );
};

export default InteractiveView;
