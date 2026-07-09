import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const categories = [
  { id: 1, nameKey: 'geologika', descKey: 'geologikaDesc', img: '/images/geologika.png' },
  { id: 2, nameKey: 'biologika', descKey: 'biologikaDesc', img: '/images/biologika.png' },
  { id: 3, nameKey: 'etnografika', descKey: 'etnografikaDesc', img: '/images/etnografika.png' },
  { id: 4, nameKey: 'arkeologika', descKey: 'arkeologikaDesc', img: '/images/arkeologika.png' },
  { id: 5, nameKey: 'historika', descKey: 'historikaDesc', img: '/images/historika.png' },
  { id: 6, nameKey: 'numismatika', descKey: 'numismatikaDesc', img: '/images/numismatika.png' },
  { id: 7, nameKey: 'filologika', descKey: 'filologikaDesc', img: '/images/filologika.png' },
  { id: 8, nameKey: 'keramologika', descKey: 'keramologikaDesc', img: '/images/keramologika.png' },
  { id: 9, nameKey: 'seniRupa', descKey: 'seniRupaDesc', img: '/images/senirupa.png' },
  { id: 10, nameKey: 'teknologika', descKey: 'teknologikaDesc', img: '/images/teknologika.png' }
];

const Catalog = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <PageTransition style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#C2B280' }}>

      <nav style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{t('tenClassifications')}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>{t('catalogDesc')}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '1.5rem'
        }}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/collection/${cat.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '1.5rem',
                border: '1px solid var(--color-stone-dark)',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                backgroundColor: 'var(--color-ecru-light)',
                // Apply background image if present, else default color
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
                // Optional hover effect when images are added
                if (!cat.img) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                } else {
                  e.currentTarget.querySelector('.overlay').style.backgroundColor = 'rgba(0,0,0,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-stone-dark)';
                e.currentTarget.style.transform = 'translateY(0)';
                if (!cat.img) {
                  e.currentTarget.style.backgroundColor = 'var(--color-ecru-light)';
                } else {
                  e.currentTarget.querySelector('.overlay').style.backgroundColor = 'rgba(0,0,0,0.6)';
                }
              }}
            >
              {/* Optional overlay for readability when image is present */}
              {cat.img && (
                <div className="overlay" style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.6)', transition: 'background-color 0.3s ease', zIndex: 1
                }}></div>
              )}

              <div style={{ position: 'relative', zIndex: 2 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: cat.img ? '#fff' : 'var(--color-text)' }}>{t(cat.nameKey)}</h2>
                <p style={{ color: cat.img ? '#d4d4d4' : 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t(cat.descKey)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </PageTransition>
  );
};

export default Catalog;
