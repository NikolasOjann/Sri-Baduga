import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Maximize2, Loader, AlertCircle, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

import bg1 from '../asset/Galery/Background-1.png';
import bg4 from '../asset/Galery/Background-4.png';
import bg6 from '../asset/Galery/Background-6.png';
import bg7 from '../asset/Galery/Background-7.png';
import bg8 from '../asset/Galery/Background-8.png';
import bg9 from '../asset/Galery/Background-9.png';
import l1Bg from '../asset/Galery/L1.jpg';

// Mapping id URL (/collection/:id) → nama klasifikasi untuk API
const KATEGORI_MAP = {
  '1': 'Geologika',
  '2': 'Biologika',
  '3': 'Etnografika',
  '4': 'Arkeologika',
  '5': 'Historika',
  '6': 'Numismatika',
  '7': 'Filologika',
  '8': 'Keramologika',
  '9': 'Seni Rupa',
  '10': 'Teknologika',
};

// Warna gradient per kategori
const KATEGORI_COLORS = {
  'Etnografika': 'linear-gradient(135deg, #6B3F1F 0%, #A0735A 50%, #C2956C 100%)',
  'Filologika': 'linear-gradient(135deg, #1F3A5F 0%, #3D6B8C 50%, #6B9BB5 100%)',
  'Seni Rupa': 'linear-gradient(135deg, #5C2E2E 0%, #8B5E3C 50%, #B58C6A 100%)',
  'default': 'linear-gradient(135deg, #3A3A34 0%, #6B6B60 50%, #9A9A8A 100%)',
};

const API_BASE = 'http://' + window.location.hostname + ':3001';

const CollectionCard = ({ item, index }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link
      key={item.id}
      to={`/interactive/${item.id}`}
      style={{
        display: 'block',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        textDecoration: 'none',
        backgroundImage: `url(${l1Bg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: 0,
        animation: 'fadeInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        animationDelay: `${Math.min(index * 0.04, 0.6)}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 45px rgba(0,0,0,0.45)';
        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.45)';
        const img = e.currentTarget.querySelector('.card-img');
        if (img) img.style.transform = 'scale(1.06)';
        const cta = e.currentTarget.querySelector('.card-cta');
        if (cta) cta.style.color = '#eab308';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        const img = e.currentTarget.querySelector('.card-img');
        if (img) img.style.transform = 'scale(1)';
        const cta = e.currentTarget.querySelector('.card-cta');
        if (cta) cta.style.color = 'rgba(255,255,255,0.85)';
      }}
    >
      {/* Efek Cahaya dari atas */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '200px',
        background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Foto artefak dengan vignette mask agar batas kotak studio menyatu halus */}
      {item.gambar && (
        <div style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          minHeight: '220px',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {!imgLoaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#1c1c1a',
              backgroundImage: 'linear-gradient(90deg, #1c1c1a 0%, #262624 50%, #1c1c1a 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
              zIndex: 1,
            }} />
          )}
          <img
            className="card-img"
            src={item.gambar}
            alt={item.nama_koleksi}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              WebkitMaskImage: 'radial-gradient(ellipse 92% 88% at 50% 50%, black 65%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 92% 88% at 50% 50%, black 65%, transparent 100%)',
              filter: 'contrast(1.06) brightness(1.02)',
              transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
              opacity: imgLoaded ? 1 : 0,
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              setImgLoaded(true);
            }}
          />
        </div>
      )}

      {!item.gambar && (
        <div style={{ height: '280px', backgroundColor: '#141412' }} />
      )}

      {/* Badge No. Inventarisasi */}
      {item.no_inventarisasi && (
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem',
          backgroundColor: 'rgba(15, 15, 13, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '0.3rem 0.8rem',
          borderRadius: '20px',
          fontSize: '0.68rem',
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: '1px',
          fontFamily: 'monospace',
          zIndex: 2,
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}>
          {item.no_inventarisasi}
        </div>
      )}

      {/* Konten judul di bawah gambar */}
      <div style={{
        position: 'relative',
        width: '100%',
        padding: '1.25rem 1.5rem 1.35rem 1.5rem',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: 2,
      }}>
        <h2 style={{
          fontSize: '1.22rem',
          color: '#637c36', 
          fontFamily: 'Kalnia',
          fontWeight: 500,
          lineHeight: 1.35,
          margin: 0,
        }}>
          {item.nama_koleksi}
        </h2>

        {/* Footer card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.3rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {item.dimensi?.panjang && (
              <span style={{
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                color: '#facc15',
                padding: '0.22rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.7rem',
                border: '1px solid rgba(212, 175, 55, 0.25)',
              }}>
                {item.dimensi.panjang}
              </span>
            )}
          </div>
          <div className="card-cta" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.78rem',
            fontWeight: 500,
            transition: 'color 0.3s ease',
          }}>
            <Maximize2 size={13} /> Detail
          </div>
        </div>
      </div>
    </Link>
  );
};

const CollectionImages = () => {
  const { id } = useParams();
  const { t } = useLanguage();

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const namaKategori = KATEGORI_MAP[id] || id;
  const gradientBg = KATEGORI_COLORS[namaKategori] || KATEGORI_COLORS['default'];

  const [randomBg] = useState(() => {
    const bgs = [bg1, bg4, bg6, bg7, bg8, bg9];
    return bgs[Math.floor(Math.random() * bgs.length)];
  });

  const [numCols, setNumCols] = useState(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    if (window.innerWidth <= 1024) return 3;
    return 4;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 480) setNumCols(1);
      else if (width <= 768) setNumCols(2);
      else if (width <= 1024) setNumCols(3);
      else setNumCols(4);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/collections/kategori/${encodeURIComponent(namaKategori)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(async data => {
        const fetchedItems = data.data || [];
        
        // Preload batch pertama agar saat grid muncul tidak ada jumping/lompatan proses load gambar ("biar ga keliatan proses load nya")
        const imagesToPreload = fetchedItems.slice(0, 16).map(item => item.gambar).filter(Boolean);
        await Promise.all(
          imagesToPreload.map(url => {
            return new Promise(resolve => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = resolve;
              img.src = url;
            });
          })
        );

        setItems(fetchedItems);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id, namaKategori]);

  return (
    <PageTransition style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#C2B280',
      backgroundImage: `url(${randomBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>

      {/* Sticky Header Wrapper */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#C2B280',
        backgroundImage: `url(${randomBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)' // Subtle shadow to separate from content below
      }}>
        {/* Navbar */}
        <nav className="nav-padding" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Left: Back Button */}
          <div style={{ flex: '1 1 0%', minWidth: '100px' }}>
            <Link to="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: '500' }}>
              <ArrowLeft size={20} /> {t('back')}
            </Link>
          </div>

          {/* Center: Title */}
          <div style={{ flex: '0 1 auto', fontFamily: 'Kalnia', fontSize: '1.6rem', color: '#1a1a1a', letterSpacing: '2px', textAlign: 'center' }}>
            {namaKategori}
          </div>

          {/* Right: Search & Count */}
          <div style={{ flex: '1 1 0%', display: 'flex', justifyContent: 'flex-end', minWidth: '280px' }}>
            {!loading && !error && items.length > 0 && (
              <div style={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#8c8c82', pointerEvents: 'none' }}>
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder={`Cari koleksi di ${namaKategori}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '30px',
                      border: '1px solid rgba(0,0,0,0.1)', outline: 'none', backgroundColor: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(10px)', fontSize: '0.9rem', color: '#1a1a1a', fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Jumlah koleksi */}
                <p style={{ color: '#4a4a44', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', margin: 0, textAlign: 'right' }}>
                  {(() => {
                    const filtered = items.filter(item => (item.nama_koleksi || '').toLowerCase().includes(searchQuery.toLowerCase()));
                    return `${filtered.length} koleksi ditemukan \u2014 ${namaKategori}`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, maxWidth: '1600px', margin: '0 auto', width: '100%', padding: '2rem 2rem 4rem' }}>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '1rem', color: '#4a4a44' }}>
            <Loader size={24} className="spin" />
            <span style={{ fontFamily: 'Kalnia', fontSize: '1.2rem' }}>Memuat koleksi...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '1rem', color: '#4a4a44', textAlign: 'center' }}>
            <AlertCircle size={48} strokeWidth={1} />
            <p style={{ fontFamily: 'Kalnia', fontSize: '1.5rem' }}>Gagal memuat koleksi</p>
            <p style={{ color: '#8c8c82', fontSize: '0.95rem' }}>
              Pastikan backend berjalan di <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>http://${window.location.hostname}:3001</code>
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '1rem', color: '#4a4a44' }}>
            <p style={{ fontFamily: 'Kalnia', fontSize: '1.8rem' }}>Belum ada koleksi</p>
            <p style={{ color: '#8c8c82' }}>Data untuk kategori <strong>{namaKategori}</strong> belum tersedia.</p>
          </div>
        )}

        {/* Grid Koleksi */}
        {!loading && !error && items.length > 0 && (
          <div>
            {(() => {
              const filteredItems = items.filter(item => (item.nama_koleksi || '').toLowerCase().includes(searchQuery.toLowerCase()));
              const columns = Array.from({ length: numCols }, () => []);
              filteredItems.forEach((item, index) => {
                columns[index % numCols].push({ item, originalIndex: index });
              });

              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '1.5rem',
                  width: '100%',
                  alignItems: 'flex-start',
                }}>
                  {columns.map((col, colIdx) => (
                    <div key={colIdx} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.75rem',
                      flex: 1,
                      minWidth: 0,
                    }}>
                      {col.map(({ item, originalIndex }) => (
                        <CollectionCard key={item.id} item={item} index={originalIndex} />
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default CollectionImages;
