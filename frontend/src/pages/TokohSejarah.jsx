import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import bgImage from '../asset/gallery/Background-7.png';
// Default data fallback if no prop is provided
const defaultTokoh = {
  nama: "Prabu Siliwangi",
  label: "TOKOH SEJARAH",
  tahun: "1482 - 1521",
  quote: "Silih Asih, Silih Asuh, Silih Asah",
  deskripsi: "Prabu Siliwangi (Sri Baduga Maharaja) adalah seorang raja dari Kerajaan Sunda Galuh (Pajajaran) yang memerintah pada tahun 1482-1521 M. Di bawah kepemimpinannya, Kerajaan Pajajaran mengalami masa keemasan dan kemakmuran yang luar biasa.",
  foto_utama: "/tokoh_img/Prabu.jpeg",
  stats: {
    masa: "39 Tahun",
    kerajaan: "Pajajaran",
    warisan: "12 Prasasti"
  },
  video: "https://www.youtube.com/embed/4O2F1aV2Q0o"
};

const TokohSejarah = ({ tokoh: propTokoh }) => {
  const navigate = useNavigate();
  const tokoh = propTokoh || defaultTokoh;

  const [activeImage, setActiveImage] = useState(tokoh.foto_utama);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Update active image if tokoh changes
  useEffect(() => {
    setActiveImage(tokoh.foto_utama);
    setIsExpanded(false);
  }, [tokoh]);

  // Handle open assistant
  const openAssistant = () => {
    window.dispatchEvent(new Event('open-assistant'));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Poppins:wght@300;400;500;600&display=swap');

        .tokoh-page {
          background-color: #E8DCC0;
          min-height: 100vh;
          width: 100vw;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow-x: hidden;
          background-image: url('${bgImage}');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-repeat: no-repeat;
        }

        /* Subtle wayang shadow placeholder (could be an actual SVG url in the future) */
        .tokoh-page::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url('data:image/svg+xml;utf8,<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50" fill="%23B08D57" fill-opacity="0.03"/></svg>');
          pointer-events: none;
          z-index: 0;
        }

        .tokoh-container {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          width: 100%;
          min-height: 100vh;
          padding: 6rem 4rem 4rem 4rem;
          gap: 4rem;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
        }

        .tokoh-left {
          width: 45%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          position: sticky;
          top: 80px;
        }

        .tokoh-right {
          width: 55%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        @media (max-width: 1024px) {
          .tokoh-container {
            flex-direction: column;
            padding: 6rem 2rem 2rem 2rem;
            gap: 2rem;
          }
          .tokoh-left {
            position: relative;
            top: 0;
            width: 100%;
          }
          .tokoh-right {
            width: 100%;
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(176, 141, 87, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(176, 141, 87, 0.8);
        }
      `}</style>

      <div className="tokoh-page">
        {/* Top Left Back Button */}
        <div style={{ position: 'absolute', zIndex: 20, top: '20px', left: '20px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#1A1A1A',
              backgroundColor: '#F5EEDC',
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '0.6rem 1.4rem',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E8DCC0';
              e.currentTarget.style.transform = 'translateX(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F5EEDC';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

        <div className="tokoh-container">

          {/* LEFT COLUMN */}
          <div className="tokoh-left">
            {/* Main Image */}
            <div style={{
              width: '100%',
              height: 'auto',
              backgroundColor: '#E8DCC0',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={activeImage}
                  alt={tokoh.nama}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </AnimatePresence>
            </div>


          </div>

          {/* RIGHT COLUMN */}
          <div className="tokoh-right">
            <div style={{
              backgroundColor: 'rgba(234, 214, 178, 0.7)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.6)',
              padding: '40px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
              width: '100%',
              maxWidth: '700px'
            }}>

              {/* Small Label */}
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5A4D3A', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                {tokoh.label}
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2.5rem, 5vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 1rem 0',
                lineHeight: 1.1
              }}>
                {tokoh.nama}
              </h1>

              {/* Badge Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: '#B08D57',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  {tokoh.tahun}
                </span>
                {tokoh.stats && tokoh.stats.kerajaan && (
                  <span style={{ color: '#5A4D3A', fontWeight: 500, fontSize: '1rem' }}>
                    {tokoh.stats.kerajaan}
                  </span>
                )}
              </div>

              {/* Quote */}
              {tokoh.quote && (
                <div style={{
                  borderLeft: '3px solid #E5C17A',
                  paddingLeft: '16px',
                  marginBottom: '2rem'
                }}>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontSize: '1.2rem',
                    color: '#5A4D3A',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    "{tokoh.quote}"
                  </p>
                </div>
              )}

              {/* Description */}
              <div 
                className="custom-scrollbar"
                style={{ 
                  marginBottom: '2rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}
              >
                <p style={{
                  color: '#2D2D2D',
                  lineHeight: 1.8,
                  fontSize: '1.05rem',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {tokoh.deskripsi}
                </p>
              </div>

              {/* Stats Grid */}
              {tokoh.stats && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2.5rem'
                }}>
                  {Object.entries(tokoh.stats).map(([key, value]) => (
                    <div key={key} style={{
                      backgroundColor: 'rgba(234, 214, 178, 0.7)',
                      backdropFilter: 'blur(15px)',
                      WebkitBackdropFilter: 'blur(15px)',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255,255,255,0.6)'
                    }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#5A4D3A', letterSpacing: '1px', marginBottom: '0.4rem', fontWeight: 600 }}>
                        {key}
                      </div>
                      <div style={{ fontSize: '1.05rem', color: '#1A1A1A', fontWeight: 600 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons Container */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* CTA Button */}
                <button style={{
                  backgroundColor: '#7A8C6E',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 8px 20px rgba(122, 140, 110, 0.3)'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6A7A60';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#7A8C6E';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Jelajahi Peninggalan
                </button>

                {/* Video Button */}
                <button
                  onClick={() => setShowVideo(true)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#7A8C6E',
                    border: '2px solid #7A8C6E',
                    padding: '12px 24px',
                    borderRadius: '30px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7A8C6E';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#7A8C6E';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Play size={20} />
                  Tonton Video
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Video Modal */}
        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem'
              }}
              onClick={() => setShowVideo(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '900px',
                  aspectRatio: '16/9',
                  backgroundColor: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowVideo(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: 'none',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                >
                  <X size={24} />
                </button>
                <iframe
                  width="100%"
                  height="100%"
                  src={tokoh.video || "https://www.youtube.com/embed/4O2F1aV2Q0o"}
                  title="Video Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                ></iframe>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default TokohSejarah;
