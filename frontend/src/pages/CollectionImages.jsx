import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const CollectionImages = () => {
  const { id } = useParams();
  const { t } = useLanguage();

  // Dummy items with images
  const items = [
    { id: '1a', title: 'Arca Nandi', img: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?auto=format&fit=crop&q=80&w=800' },
    { id: '1b', title: 'Mahkota Binokasih', img: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&q=80&w=800' },
    { id: '1c', title: 'Kereta Jempana', img: 'https://images.unsplash.com/photo-1528643809623-690226456073?auto=format&fit=crop&q=80&w=800' },
    { id: '1d', title: 'Prasasti Kawali', img: 'https://images.unsplash.com/photo-1549429731-f11100236de9?auto=format&fit=crop&q=80&w=800' },
    { id: '1e', title: 'Kujang Pajajaran', img: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800' },
    { id: '1f', title: 'Batik Sunda', img: 'https://images.unsplash.com/photo-1518349619113-03114f06ac3a?auto=format&fit=crop&q=80&w=800' },
  ];

  return (
    <PageTransition style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#C2B280' }}>

      <nav style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Link to="/catalog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s' }}>
          <ArrowLeft size={20} /> {t('back')}
        </Link>
        <div style={{ fontFamily: 'Kalnia', fontSize: '1.5rem', color: '#1a1a1a', letterSpacing: '2px' }}>
          Galeri Kategori {id}
        </div>
        <div style={{ width: '80px' }}></div> {/* Spacer */}
      </nav>

      <div className="container" style={{ flex: 1, paddingBottom: '4rem', maxWidth: '1600px', margin: '0 auto', width: '100%', padding: '0 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gridAutoRows: '250px',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {items.map((item, index) => {
            // Make some items span 2 rows or 2 columns for a masonry gallery feel
            const isLarge = index === 0 || index === 3;
            const isWide = index === 2 || index === 5;

            return (
              <Link
                key={item.id}
                to={`/interactive/1`} /* Link hardcoded to 1 to show the 3D scroll we built */
                style={{
                  gridColumn: isWide ? 'span 2' : 'span 1',
                  gridRow: isLarge ? 'span 2' : 'span 1',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'flex-end',
                  transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.querySelector('.overlay').style.backgroundColor = 'rgba(0,0,0,0.3)';
                  e.currentTarget.querySelector('.content').style.transform = 'translateY(0)';
                  e.currentTarget.querySelector('.content').style.opacity = '1';
                  e.currentTarget.querySelector('img').style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.querySelector('.overlay').style.backgroundColor = 'rgba(0,0,0,0.6)';
                  e.currentTarget.querySelector('.content').style.transform = 'translateY(10px)';
                  e.currentTarget.querySelector('.content').style.opacity = '0.8';
                  e.currentTarget.querySelector('img').style.transform = 'scale(1)';
                }}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.6s ease',
                    zIndex: 1
                  }}
                />
                <div className="overlay" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  transition: 'background-color 0.4s ease',
                  zIndex: 2
                }}></div>
                <div className="content" style={{
                  position: 'relative',
                  zIndex: 3,
                  padding: '2rem',
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                  transform: 'translateY(10px)',
                  opacity: 0.8,
                  transition: 'all 0.4s ease'
                }}>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#fff', fontWeight: 500 }}>{item.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a3a3a3', fontSize: '0.9rem' }}>
                    <Maximize2 size={14} /> 3D View
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </PageTransition>
  );
};

export default CollectionImages;
