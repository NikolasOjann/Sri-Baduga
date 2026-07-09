import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Maximize2, Loader, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// Mapping id URL (/collection/:id) → nama klasifikasi untuk API
const KATEGORI_MAP = {
  '1':  'Geologika',
  '2':  'Biologika',
  '3':  'Etnografika',
  '4':  'Arkeologika',
  '5':  'Historika',
  '6':  'Numismatika',
  '7':  'Filologika',
  '8':  'Keramologika',
  '9':  'Seni Rupa',
  '10': 'Teknologika',
};

// Warna gradient per kategori
const KATEGORI_COLORS = {
  'Etnografika': 'linear-gradient(135deg, #6B3F1F 0%, #A0735A 50%, #C2956C 100%)',
  'Filologika':  'linear-gradient(135deg, #1F3A5F 0%, #3D6B8C 50%, #6B9BB5 100%)',
  'Seni Rupa':   'linear-gradient(135deg, #5C2E2E 0%, #8B5E3C 50%, #B58C6A 100%)',
  'default':     'linear-gradient(135deg, #3A3A34 0%, #6B6B60 50%, #9A9A8A 100%)',
};

const API_BASE = 'http://localhost:3001';

const CollectionImages = () => {
  const { id } = useParams();
  const { t }  = useLanguage();

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const namaKategori = KATEGORI_MAP[id] || id;
  const gradientBg   = KATEGORI_COLORS[namaKategori] || KATEGORI_COLORS['default'];

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/collections/kategori/${encodeURIComponent(namaKategori)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setItems(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id, namaKategori]);

  return (
    <PageTransition style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#C2B280' }}>

      {/* Navbar */}
      <nav style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Link to="/catalog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: '500' }}>
          <ArrowLeft size={20} /> {t('back')}
        </Link>
        <div style={{ fontFamily: 'Kalnia', fontSize: '1.5rem', color: '#1a1a1a', letterSpacing: '2px' }}>
          {namaKategori}
        </div>
        <div style={{ width: '80px' }} />
      </nav>

      {/* Content Area */}
      <div style={{ flex: 1, maxWidth: '1600px', margin: '0 auto', width: '100%', padding: '0 2rem 4rem' }}>

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
              Pastikan backend berjalan di <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:3001</code>
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
          <>
            {/* Jumlah koleksi */}
            <p style={{ color: '#4a4a44', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2rem', marginTop: '0.5rem' }}>
              {items.length} koleksi &mdash; {namaKategori}
            </p>

            <div style={{
              columnCount: 4,
              columnGap: '1.5rem',
            }}>
              {items.map((item, index) => {
                return (
                  <Link
                    key={item.id}
                    to={`/interactive/${item.id}`}
                    style={{
                      breakInside: 'avoid',
                      marginBottom: '1.5rem',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      position: 'relative',
                      textDecoration: 'none',
                      display: 'block',
                      background: gradientBg,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';
                      const img = e.currentTarget.querySelector('.card-img');
                      if (img) img.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                      const img = e.currentTarget.querySelector('.card-img');
                      if (img) img.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Foto artefak yang menentukan tinggi natural card */}
                    {item.gambar && (
                      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', minHeight: '180px' }}>
                        <img
                          className="card-img"
                          src={item.gambar}
                          alt={item.nama_koleksi}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            transition: 'transform 0.6s ease',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Jika tidak ada gambar, berikan padding agar card tetap seimbang */}
                    {!item.gambar && (
                      <div style={{ height: '140px' }} />
                    )}

                    {/* Nomor urut dekoratif */}
                    <div style={{
                      position: 'absolute', top: '1.2rem', right: '1.5rem',
                      fontSize: '3.5rem', fontFamily: 'Kalnia',
                      color: 'rgba(255,255,255,0.15)', fontWeight: 'bold', lineHeight: 1,
                      userSelect: 'none',
                      zIndex: 2,
                    }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Badge No. Inventarisasi */}
                    {item.no_inventarisasi && (
                      <div style={{
                        position: 'absolute', top: '1.2rem', left: '1.2rem',
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(8px)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.68rem',
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: '1px',
                        fontFamily: 'monospace',
                        zIndex: 2,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}>
                        {item.no_inventarisasi}
                      </div>
                    )}

                    {/* Konten deskripsi di atas gambar (overlay gradient) */}
                    <div style={{
                      position: item.gambar ? 'absolute' : 'relative',
                      bottom: 0, left: 0, right: 0,
                      padding: '2.5rem 1.75rem 1.5rem',
                      background: item.gambar
                        ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0) 100%)'
                        : 'transparent',
                      zIndex: 2,
                    }}>
                      <h2 style={{
                        fontSize: '1.35rem',
                        marginBottom: '0.4rem',
                        color: '#fff',
                        fontFamily: 'Kalnia',
                        fontWeight: 500,
                        lineHeight: 1.25,
                      }}>
                        {item.nama_koleksi}
                      </h2>

                      {item.deskripsi && (
                        <p style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.82rem',
                          lineHeight: 1.55,
                          marginBottom: '1rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {item.deskripsi}
                        </p>
                      )}

                      {/* Footer card: kondisi + dimensi + cta */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {item.kondisi && (
                            <span style={{
                              backgroundColor: item.kondisi.toLowerCase() === 'baik' || item.kondisi.toLowerCase() === 'utuh'
                                ? 'rgba(74,222,128,0.25)'
                                : 'rgba(251,191,36,0.25)',
                              color: item.kondisi.toLowerCase() === 'baik' || item.kondisi.toLowerCase() === 'utuh' ? '#4ade80' : '#fbbf24',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '10px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                              {item.kondisi}
                            </span>
                          )}
                          {item.dimensi?.panjang && (
                            <span style={{
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.85)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '10px',
                              fontSize: '0.68rem',
                            }}>
                              {item.dimensi.panjang}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                          <Maximize2 size={12} /> Detail
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

      </div>
    </PageTransition>
  );
};

export default CollectionImages;
