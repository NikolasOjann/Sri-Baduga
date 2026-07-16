import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import bgImage from '../asset/Galery/Background-12.png';

const categories = [
  { id: 1, nameKey: 'geologika', name: 'Geologika', descKey: 'geologikaDesc', img: '/images/geologika.png' },
  { id: 2, nameKey: 'biologika', name: 'Biologika', descKey: 'biologikaDesc', img: '/images/biologika.png' },
  { id: 3, nameKey: 'etnografika', name: 'Etnografika', descKey: 'etnografikaDesc', img: '/images/etnografika.png' },
  { id: 4, nameKey: 'arkeologika', name: 'Arkeologika', descKey: 'arkeologikaDesc', img: '/images/arkeologika.png' },
  { id: 5, nameKey: 'historika', name: 'Historika', descKey: 'historikaDesc', img: '/images/historika.png' },
  { id: 6, nameKey: 'numismatika', name: 'Numismatika', descKey: 'numismatikaDesc', img: '/images/numismatika.png' },
  { id: 7, nameKey: 'filologika', name: 'Filologika', descKey: 'filologikaDesc', img: '/images/filologika.png' },
  { id: 8, nameKey: 'keramologika', name: 'Keramologika', descKey: 'keramologikaDesc', img: '/images/keramologika.png' },
  { id: 9, nameKey: 'seniRupa', name: 'Seni Rupa', descKey: 'seniRupaDesc', img: '/images/senirupa.png' },
  { id: 10, nameKey: 'teknologika', name: 'Teknologika', descKey: 'teknologikaDesc', img: '/images/teknologika.png' }
];

const Catalog = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetch('http://localhost:3001/api/collections/stats/counts')
      .then(res => res.json())
      .then(data => setCounts(data || {}))
      .catch(() => setCounts({}));
  }, []);

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

    </PageTransition>
  );

};

export default Catalog;
