import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../animations/PageTransition';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import aboutImage from '../asset/Galery/About.jpg';

const About = () => {
  return (
    <PageTransition style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={20} /> Kembali
        </Link>
        <Link to="/catalog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
          Katalog <ArrowRight size={20} />
        </Link>
      </nav>

      <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4rem', paddingBottom: '4rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: '100%', height: '500px', backgroundColor: 'var(--color-stone-dark)', borderRadius: '2px', position: 'relative' }}>
            {/* Placeholder for Museum Image */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-bg)' }}>
              <img
                src={aboutImage}
                alt="Gedung Museum Sri Baduga"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '2px' // Menyamakan dengan lengkungan kotak parent-nya
                }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '200px', height: '200px', border: '1px solid var(--color-text)', zIndex: -1 }}></div>
          </div>
        </div>


        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>Penjaga Tatanan Sunda</h1>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Diresmikan pada tanggal 5 Juni 1980, Museum Negeri Provinsi Jawa Barat Sri Baduga merupakan rumah bagi ribuan peninggalan sejarah yang menceritakan perjalanan peradaban masyarakat Jawa Barat dari masa ke masa.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
            Nama Sri Baduga diambil dari gelar raja Pajajaran, Sri Baduga Maharaja, yang membawa masa kejayaan di bumi Pasundan. Melalui website ini, Anda diundang untuk mengeksplorasi warisan tak ternilai tersebut secara virtual.
          </p>
          <Link to="/catalog" className="btn-primary">
            Lihat Koleksi
          </Link>
        </div>
      </div>

    </PageTransition >
  );
};

export default About;
