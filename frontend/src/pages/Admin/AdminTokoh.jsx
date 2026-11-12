import React, { useState, useEffect } from 'react';

function AdminTokoh() {
  const [tokohList, setTokohList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    label: 'TOKOH SEJARAH',
    tahun: '',
    quote: '',
    deskripsi: '',
    video: '',
    masa: '',
    kerajaan: '',
    warisan: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchTokoh = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/tokoh/admin');
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setTokohList(data);
    } catch (error) {
      console.error('Error fetching tokoh:', error);
      alert('Gagal mengambil data tokoh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokoh();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleEdit = (tokoh) => {
    setIsEditing(true);
    setCurrentId(tokoh.id);
    setFormData({
      nama: tokoh.nama || '',
      label: tokoh.label || 'TOKOH SEJARAH',
      tahun: tokoh.tahun || '',
      quote: tokoh.quote || '',
      deskripsi: tokoh.deskripsi || '',
      video: tokoh.video || '',
      masa: tokoh.masa || '',
      kerajaan: tokoh.kerajaan || '',
      warisan: tokoh.warisan || ''
    });
    setPreviewImage(tokoh.foto_utama ? `http://localhost:3001${tokoh.foto_utama}` : null);
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus tokoh ini?')) {
      try {
        await fetch(`http://localhost:3001/api/tokoh/${id}`, { method: 'DELETE' });
        fetchTokoh();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Gagal menghapus tokoh');
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      nama: '', label: 'TOKOH SEJARAH', tahun: '', quote: '', deskripsi: '', video: '', masa: '', kerajaan: '', warisan: ''
    });
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = new FormData();
    Object.keys(formData).forEach(key => {
      form.append(key, formData[key]);
    });
    if (imageFile) {
      form.append('foto_utama', imageFile);
    }

    try {
      if (isEditing) {
        const res = await fetch(`http://localhost:3001/api/tokoh/${currentId}`, {
          method: 'PUT',
          body: form
        });
        if (!res.ok) throw new Error('Gagal update');
        alert('Berhasil memperbarui tokoh');
      } else {
        const res = await fetch('http://localhost:3001/api/tokoh', {
          method: 'POST',
          body: form
        });
        if (!res.ok) throw new Error('Gagal nambah');
        alert('Berhasil menambahkan tokoh');
      }
      resetForm();
      fetchTokoh();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan tokoh');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1A1A1A' }}>Kelola Tokoh Sejarah</h2>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Form Container */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
            {isEditing ? 'Edit Tokoh' : 'Tambah Tokoh Baru'}
          </h4>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Nama Tokoh</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} style={inputStyle} required />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Label</label>
                <input type="text" name="label" value={formData.label} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Tahun (Contoh: 1482 - 1521)</label>
                <input type="text" name="tahun" value={formData.tahun} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Quote / Kutipan</label>
              <input type="text" name="quote" value={formData.quote} onChange={handleInputChange} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Deskripsi Lengkap</label>
              <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '100px' }} required />
            </div>

            <div>
              <label style={labelStyle}>URL Video (Opsional)</label>
              <input type="text" name="video" value={formData.video} onChange={handleInputChange} style={inputStyle} placeholder="https://youtube.com/..." />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Masa Menjabat</label>
                <input type="text" name="masa" value={formData.masa} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Kerajaan / Institusi</label>
                <input type="text" name="kerajaan" value={formData.kerajaan} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Warisan</label>
                <input type="text" name="warisan" value={formData.warisan} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Foto Utama</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
              {previewImage && (
                <div style={{ marginTop: '10px' }}>
                  <img src={previewImage} alt="Preview" style={{ width: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={btnStyle('#28a745')}>
                {isEditing ? 'Simpan Perubahan' : 'Tambah Tokoh'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} style={btnStyle('#6c757d')}>
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Container */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
            Daftar Tokoh
          </h4>
          
          {loading ? (
            <p>Loading data...</p>
          ) : tokohList.length === 0 ? (
            <p>Belum ada data tokoh sejarah.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tokohList.map(tokoh => (
                <div key={tokoh.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', border: '1px solid #eee', borderRadius: '6px' }}>
                  <img 
                    src={tokoh.foto_utama ? `http://localhost:3001${tokoh.foto_utama}` : 'https://via.placeholder.com/50'} 
                    alt={tokoh.nama}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{tokoh.nama}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{tokoh.tahun}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => handleEdit(tokoh)} style={{ ...actionBtnStyle, backgroundColor: '#007bff' }}>Edit</button>
                    <button onClick={() => handleDelete(tokoh.id)} style={{ ...actionBtnStyle, backgroundColor: '#dc3545' }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#333' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' };
const btnStyle = (bg) => ({
  padding: '10px 20px',
  backgroundColor: bg,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
});
const actionBtnStyle = {
  padding: '5px 10px',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};

export default AdminTokoh;
