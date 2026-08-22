import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const standardCategories = [
  'Geologika', 'Biologika', 'Etnografika', 'Arkeologika', 'Historika',
  'Numismatika', 'Filologika', 'Keramologika', 'Seni Rupa', 'Teknologika'
];

function EditDataset() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    klasifikasi: 'Historika',
    tanggal_registrasi: '',
    no_registrasi: '',
    no_registrasi_nasional: '',
    tanggal_inventarisasi: '',
    no_inventarisasi: '',
    status_cb: '',
    nama_koleksi: '',
    tanggal_perolehan: '',
    deskripsi: '',
    dimensi: { panjang: '', lebar: '', tinggi: '', berat: '', tebal: '', diameter: '', karat: '' },
    gambar: '',
    dokumentasi: [],
    pemilik_koleksi: 'Museum Sri Baduga',
    jenis_pengadaan: '',
    tahun_masuk: '',
    tempat_penyimpanan: '',
    cara_pembuatan: '',
    cara_perolehan: '',
    lokasi_provinsi: 'Jawa Barat',
    lokasi_kabupaten: '',
    latitude: '',
    longitude: '',
    estimasi_harga: '',
    tim_pengkaji: [],
    is_public: true,
    sejarah: '',
    kondisi: '',
    tanggal_pengamatan: '',
    acuan: '',
    keterangan: ''
  });

  useEffect(() => {
    if (isEditMode) {
      fetchDataset();
    }
  }, [id]);

  const fetchDataset = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://${window.location.hostname}:3001/api/admin/datasets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Gabungkan data lama dengan state default jika ada field yang belum ada
        setFormData(prev => ({
          ...prev,
          ...data,
          dimensi: { ...prev.dimensi, ...(data.dimensi || {}) },
          dokumentasi: data.dokumentasi || [],
          tim_pengkaji: data.tim_pengkaji || [],
          is_public: data.is_public !== undefined ? data.is_public : true
        }));
      } else {
        alert('Data tidak ditemukan');
        navigate('/1974-SriBaduga/dashboard/datasets');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDimensiChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dimensi: { ...prev.dimensi, [name]: value }
    }));
  };

  const handleQuillChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e, type, index = null) => {
    if (!formData.klasifikasi) {
      alert('Silakan pilih Klasifikasi terlebih dahulu sebelum mengunggah gambar!');
      e.target.value = '';
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const fd = new FormData();
    fd.append('gambar_file', file);
    fd.append('klasifikasi', formData.klasifikasi);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://${window.location.hostname}:3001/api/admin/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload gambar.');

      if (type === 'main') {
        setFormData(prev => ({ ...prev, gambar: data.url }));
      } else if (type === 'dokumentasi' && index !== null) {
        const newDok = [...formData.dokumentasi];
        newDok[index].foto = data.url;
        setFormData(prev => ({ ...prev, dokumentasi: newDok }));
      } else if (type === 'dokumentasi_new') {
        setFormData(prev => ({
          ...prev,
          dokumentasi: [...prev.dokumentasi, { foto: data.url, judul: '', deskripsi: '', photographer: '' }]
        }));
      }
    } catch (err) {
      alert(`Error upload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDokumentasiChange = (index, field, value) => {
    const newDok = [...formData.dokumentasi];
    newDok[index][field] = value;
    setFormData(prev => ({ ...prev, dokumentasi: newDok }));
  };

  const handleRemoveDokumentasi = (index) => {
    if(!window.confirm('Hapus foto ini?')) return;
    const newDok = [...formData.dokumentasi];
    newDok.splice(index, 1);
    setFormData(prev => ({ ...prev, dokumentasi: newDok }));
  };

  const handleAddTimPengkaji = () => {
    setFormData(prev => ({ ...prev, tim_pengkaji: [...prev.tim_pengkaji, ''] }));
  };

  const handleTimPengkajiChange = (index, value) => {
    const newTim = [...formData.tim_pengkaji];
    newTim[index] = value;
    setFormData(prev => ({ ...prev, tim_pengkaji: newTim }));
  };

  const handleRemoveTimPengkaji = (index) => {
    const newTim = [...formData.tim_pengkaji];
    newTim.splice(index, 1);
    setFormData(prev => ({ ...prev, tim_pengkaji: newTim }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const url = isEditMode
      ? `http://${window.location.hostname}:3001/api/admin/datasets/${id}`
      : `http://${window.location.hostname}:3001/api/admin/datasets`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data.');
      alert(data.message);
      navigate('/1974-SriBaduga/dashboard/datasets');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: '20px' }}>Memuat data...</div>;

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', borderTop: '4px solid #198754', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
          {isEditMode ? `Edit Koleksi: ${formData.nama_koleksi}` : 'Koleksi Baru'}
        </h2>
        <button 
          onClick={() => navigate('/1974-SriBaduga/dashboard/datasets')}
          style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Kembali
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Row: Status Publik */}
        <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#495057', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              name="is_public" 
              checked={formData.is_public} 
              onChange={handleChange} 
              style={{ width: '18px', height: '18px' }}
            />
            Tampilkan Koleksi ini di Halaman Publik (Website Pengunjung)
          </label>
        </div>

        {/* Row: Klasifikasi */}
        <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Klasifikasi <span style={{ color: 'red' }}>*</span></label>
          <select 
            name="klasifikasi" 
            value={formData.klasifikasi} 
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
          >
            {standardCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Row: Tanggal Registrasi & No Registrasi & No Registrasi Nasional */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tanggal Registrasi</label>
            <input type="date" name="tanggal_registrasi" value={formData.tanggal_registrasi} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>No Registrasi <span style={{ color: 'red' }}>*</span></label>
            <input type="text" name="no_registrasi" value={formData.no_registrasi} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>No Registrasi Nasional</label>
            <input type="text" name="no_registrasi_nasional" value={formData.no_registrasi_nasional} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Tanggal Inventarisasi & No Inventaris & Status CB */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tanggal Inventarisasi</label>
            <input type="date" name="tanggal_inventarisasi" value={formData.tanggal_inventarisasi} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>No Inventaris</label>
            <input type="text" name="no_inventarisasi" value={formData.no_inventarisasi} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Status CB</label>
            <input type="text" name="status_cb" value={formData.status_cb} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Nama Koleksi */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Nama Koleksi <span style={{ color: 'red' }}>*</span></label>
          <input type="text" name="nama_koleksi" value={formData.nama_koleksi} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Tanggal Perolehan */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tanggal Perolehan</label>
          <input type="datetime-local" name="tanggal_perolehan" value={formData.tanggal_perolehan} onChange={handleChange} style={{ width: '33%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Uraian Singkat */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Uraian Singkat</label>
          <ReactQuill theme="snow" value={formData.deskripsi} onChange={(val) => handleQuillChange('deskripsi', val)} style={{ backgroundColor: 'white', marginBottom: '40px', height: '150px' }} />
        </div>

        {/* Row: Dimensi (Panjang, Lebar, Tinggi, Berat) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Panjang (mm)</label>
            <input type="text" name="panjang" value={formData.dimensi.panjang} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Lebar (mm)</label>
            <input type="text" name="lebar" value={formData.dimensi.lebar} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tinggi (mm)</label>
            <input type="text" name="tinggi" value={formData.dimensi.tinggi} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Berat (gram)</label>
            <input type="text" name="berat" value={formData.dimensi.berat} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Dimensi (Tebal, Diameter, Karat) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tebal (mm)</label>
            <input type="text" name="tebal" value={formData.dimensi.tebal} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Diameter (mm)</label>
            <input type="text" name="diameter" value={formData.dimensi.diameter} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Karat (gram)</label>
            <input type="text" name="karat" value={formData.dimensi.karat} onChange={handleDimensiChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Foto Koleksi */}
        <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Foto Koleksi</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: '12px', color: '#6c757d', textAlign: 'right', marginTop: '-25px', marginBottom: '10px' }}>Max photo 2MB</div>
          {formData.gambar && (
            <img src={formData.gambar} alt="Koleksi" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
          )}
        </div>

        {/* Row: Dokumentasi Koleksi */}
        <div style={{ border: '1px solid #dee2e6', borderRadius: '4px' }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#495057' }}>
            Dokumentasi Koleksi
          </div>
          <div style={{ padding: '15px' }}>
            {formData.dokumentasi.map((dok, index) => (
              <div key={index} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '4px', marginBottom: '15px', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  {dok.foto ? (
                    <img src={dok.foto} alt={`Dokumen ${index}`} style={{ width: '150px', height: '150px', objectFit: 'cover', border: '1px solid #ddd', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '150px', height: '150px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>No Image</div>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'dokumentasi', index)} />
                  </div>
                </div>
                <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={{ color: '#495057' }}>Ubah Foto</label>
                    <button type="button" onClick={() => handleRemoveDokumentasi(index)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Hapus Foto</button>
                  </div>
                  <div>
                    <input type="text" placeholder="Judul" value={dok.judul} onChange={(e) => handleDokumentasiChange(index, 'judul', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <input type="text" placeholder="Deskripsi" value={dok.deskripsi} onChange={(e) => handleDokumentasiChange(index, 'deskripsi', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <input type="text" placeholder="Photographer" value={dok.photographer} onChange={(e) => handleDokumentasiChange(index, 'photographer', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            ))}
            
            <div style={{ border: '1px dashed #ced4da', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Tambah Foto Dokumentasi Baru</p>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'dokumentasi_new')} />
            </div>
          </div>
        </div>

        {/* Row: Pemilik & Jenis Pengadaan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Pemilik Koleksi</label>
            <input type="text" name="pemilik_koleksi" value={formData.pemilik_koleksi} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Jenis Pengadaan</label>
            <input type="text" name="jenis_pengadaan" value={formData.jenis_pengadaan} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Tahun Pengadaan */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tahun Pengadaan</label>
          <input type="text" name="tahun_masuk" value={formData.tahun_masuk} onChange={handleChange} style={{ width: '49%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Lokasi Simpan */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Lokasi Simpan</label>
          <input type="text" name="tempat_penyimpanan" value={formData.tempat_penyimpanan} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Cara Pembuatan & Cara Perolehan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Cara Pembuatan</label>
            <textarea name="cara_pembuatan" value={formData.cara_pembuatan} onChange={handleChange} rows="4" style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Cara Perolehan</label>
            <textarea name="cara_perolehan" value={formData.cara_perolehan} onChange={handleChange} rows="4" style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
          </div>
        </div>

        {/* Row: Lokasi Provinsi & Kabupaten */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Lokasi Provinsi</label>
            <input type="text" name="lokasi_provinsi" value={formData.lokasi_provinsi} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Lokasi Kabupaten</label>
            <input type="text" name="lokasi_kabupaten" value={formData.lokasi_kabupaten} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Latitude & Longitude */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Latitude</label>
            <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Longitude</label>
            <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Row: Estimasi Harga */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Estimasi Harga</label>
          <input type="text" name="estimasi_harga" value={formData.estimasi_harga} onChange={handleChange} style={{ width: '49%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Tim Pengkaji */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Nama Tim Pengkaji (bisa lebih dari satu)</label>
          {formData.tim_pengkaji.map((tim, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" value={tim} onChange={(e) => handleTimPengkajiChange(index, e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => handleRemoveTimPengkaji(index)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button>
            </div>
          ))}
          <button type="button" onClick={handleAddTimPengkaji} style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>+ Tambah Tim Pengkaji</button>
        </div>

        {/* Row: Keterangan Lainnya */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Keterangan Lainnya</label>
          <ReactQuill theme="snow" value={formData.keterangan} onChange={(val) => handleQuillChange('keterangan', val)} style={{ backgroundColor: 'white', marginBottom: '40px', height: '150px' }} />
        </div>

        {/* Row: Sejarah */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Sejarah</label>
          <ReactQuill theme="snow" value={formData.sejarah} onChange={(val) => handleQuillChange('sejarah', val)} style={{ backgroundColor: 'white', marginBottom: '40px', height: '150px' }} />
        </div>

        {/* Row: Kondisi Koleksi */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Kondisi Koleksi</label>
          <input type="text" name="kondisi" value={formData.kondisi} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Tanggal Pengamatan */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Tanggal Pengamatan</label>
          <input type="date" name="tanggal_pengamatan" value={formData.tanggal_pengamatan} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        {/* Row: Acuan */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Acuan</label>
          <textarea name="acuan" value={formData.acuan} onChange={handleChange} rows="4" style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
          <button type="button" onClick={() => navigate('/1974-SriBaduga/dashboard/datasets')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' }}>Batal</button>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            {loading ? 'Menyimpan...' : 'Simpan Koleksi'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default EditDataset;
