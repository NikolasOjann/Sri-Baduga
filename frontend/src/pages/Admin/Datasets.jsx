import React, { useState, useEffect } from 'react';

function Datasets() {
  // ================= State Upload PDF =================
  const [file, setFile] = useState(null);
  const [idPetugas, setIdPetugas] = useState('');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // ================= State Data Table =================
  const [datasets, setDatasets] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ================= State Search & Filter =================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('');

  // ================= State Modal CRUD =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nama_koleksi: '',
    no_registrasi: '',
    klasifikasi: 'Geologika',
    deskripsi: '',
    gambar: ''
  });
  const [modalLoading, setModalLoading] = useState(false);

  // ================= State Selection =================
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(datasets.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} data terpilih?`)) return;
    
    setLoadingData(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`http://localhost:3001/api/admin/datasets/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      setSelectedIds([]);
      fetchDatasets();
    } catch (err) {
      alert('Gagal menghapus data: ' + err.message);
    }
    setLoadingData(false);
  };

  const standardCategories = [
    'Geologika', 'Biologika', 'Etnografika', 'Arkeologika', 'Historika',
    'Numismatika', 'Filologika', 'Keramologika', 'Seni Rupa', 'Teknologika'
  ];

  const fetchDatasets = async () => {
    setLoadingData(true);
    try {
      let url = 'http://localhost:3001/api/collections?limit=100';
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterKlasifikasi) url += `&klasifikasi=${encodeURIComponent(filterKlasifikasi)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDatasets(data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // Debounce search agar tidak spam API saat mengetik
    const delayDebounceFn = setTimeout(() => {
      fetchDatasets();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterKlasifikasi]); // Trigger ulang ketika kata pencarian atau klasifikasi berubah

  // ================= Handlers Upload PDF =================
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Pilih file PDF terlebih dahulu.');
      return;
    }
    if (!idPetugas || !namaPetugas) {
      setError('ID Petugas dan Nama Petugas wajib diisi.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('adminToken');
    const fd = new FormData();
    fd.append('pdf_file', file);
    fd.append('id_petugas', idPetugas);
    fd.append('nama_petugas', namaPetugas);
    fd.append('tanggal_upload', new Date().toISOString());

    try {
      const res = await fetch('http://localhost:3001/api/admin/datasets/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah file.');

      setMessage(`Berhasil: ${data.message}`);
      setFile(null);
      e.target.reset();
      fetchDatasets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= Handlers CRUD Manual =================
  const openCreateModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({ nama_koleksi: '', no_registrasi: '', klasifikasi: '', deskripsi: '', gambar: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setEditId(item.id);
    setFormData({ 
      nama_koleksi: item.nama_koleksi || '', 
      no_registrasi: item.no_registrasi || '', 
      klasifikasi: item.klasifikasi || '', 
      deskripsi: item.deskripsi || '',
      gambar: item.gambar || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    if (!formData.klasifikasi) {
      alert('Silakan pilih Klasifikasi terlebih dahulu sebelum mengunggah gambar!');
      e.target.value = '';
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    setModalLoading(true);
    const fd = new FormData();
    fd.append('gambar_file', file);
    fd.append('klasifikasi', formData.klasifikasi);
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:3001/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload gambar.');
      
      setFormData(prev => ({ ...prev, gambar: data.url }));
    } catch (err) {
      alert(`Error upload: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    const token = localStorage.getItem('adminToken');
    const url = isEditMode 
      ? `http://localhost:3001/api/admin/datasets/${editId}` 
      : 'http://localhost:3001/api/admin/datasets';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const payload = {
        ...formData,
        nama_petugas: 'Admin Manual (Form)'
      };

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data.');

      alert(data.message);
      closeModal();
      fetchDatasets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus data "${nama}"? Data yang dihapus tidak bisa dikembalikan.`)) {
      return;
    }
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://localhost:3001/api/admin/datasets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data.');
      fetchDatasets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'normal' }}>Kelola Dataset PDF</h1>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Form Upload PDF */}
        <div style={{ 
          flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '4px', 
          borderTop: '3px solid #28a745', boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)'
        }}>
          <h3 style={{ marginTop: 0 }}>Tambah via Upload PDF</h3>
          <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
            Unggah file PDF baru untuk diekstrak otomatis.
          </p>

          {message && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '15px' }}>{message}</div>}
          {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>ID Petugas</label>
              <input 
                type="text" 
                placeholder="Contoh: PTG-001"
                value={idPetugas}
                onChange={(e) => setIdPetugas(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Nama Petugas</label>
              <input 
                type="text" 
                placeholder="Nama Lengkap"
                value={namaPetugas}
                onChange={(e) => setNamaPetugas(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>File PDF Dataset</label>
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '10px 20px', backgroundColor: '#28a745', color: 'white', 
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}>
              {loading ? 'Memproses PDF...' : 'Unggah & Ekstrak'}
            </button>
          </form>
        </div>

        {/* Panel Tambah Manual */}
        <div style={{ 
          flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '4px', 
          borderTop: '3px solid #007bff', boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)'
        }}>
          <h3 style={{ marginTop: 0 }}>Tambah Data Manual</h3>
          <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
            Jika Anda tidak memiliki dokumen PDF, Anda bisa menambahkan artefak baru secara manual dengan mengisi form langsung ke database JSON.
          </p>
          <button 
            onClick={openCreateModal}
            style={{ 
              padding: '10px 20px', backgroundColor: '#007bff', color: 'white', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}>
            + Buat Data Manual
          </button>
        </div>
      </div>

      {/* Tabel Data Koleksi */}
      <div style={{ 
        backgroundColor: 'white', padding: '20px', borderRadius: '4px', marginTop: '20px',
        borderTop: '3px solid #17a2b8', boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Daftar Koleksi Tersimpan</h3>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '10px', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Cari nama atau deskripsi artefak (otomatis)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px' }}
            />
          </form>
          <select 
            value={filterKlasifikasi}
            onChange={(e) => setFilterKlasifikasi(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', width: '250px', fontSize: '14px' }}
          >
            <option value="">-- Semua Klasifikasi --</option>
            {standardCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Hapus Terpilih ({selectedIds.length})
            </button>
          )}
        </div>
        
        {loadingData ? (
          <p>Memuat data...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f6f9', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={datasets.length > 0 && selectedIds.length === datasets.length}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Gambar</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>No Registrasi</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nama Koleksi</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Klasifikasi</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {datasets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data</td>
                  </tr>
                ) : (
                  datasets.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>{item.id}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.gambar ? (
                          <img src={item.gambar} alt="Thumbnail" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '50px', height: '50px', backgroundColor: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6c757d' }}>No Img</div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>{item.no_registrasi || '-'}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama_koleksi}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
                        }}>
                          {item.klasifikasi}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => openEditModal(item)}
                          style={{ 
                            padding: '4px 8px', backgroundColor: '#ffc107', color: 'black', border: 'none', 
                            borderRadius: '3px', cursor: 'pointer', marginRight: '5px', fontSize: '12px'
                          }}>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.nama_koleksi)}
                          style={{ 
                            padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', 
                            borderRadius: '3px', cursor: 'pointer', fontSize: '12px'
                          }}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD Manual */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
            width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
              {isEditMode ? 'Edit Data Koleksi' : 'Tambah Data Manual'}
            </h2>
            
            <form onSubmit={handleSaveManual}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Nama Koleksi *</label>
                <input 
                  type="text" 
                  name="nama_koleksi"
                  value={formData.nama_koleksi}
                  onChange={handleModalChange}
                  required
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>No Registrasi *</label>
                <input 
                  type="text" 
                  name="no_registrasi"
                  value={formData.no_registrasi}
                  onChange={handleModalChange}
                  required
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Klasifikasi *</label>
                <select 
                  name="klasifikasi"
                  value={formData.klasifikasi}
                  onChange={handleModalChange}
                  required
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
                >
                  <option value="" disabled>-- Pilih Klasifikasi --</option>
                  {standardCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Upload Gambar / Foto</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ flex: 1, padding: '6px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {formData.gambar && (
                    <img src={formData.gambar} alt="Preview" style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                  )}
                </div>
                {formData.gambar && (
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#28a745' }}>
                    ✓ Gambar tersimpan ({formData.gambar.split('/').pop()})
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Deskripsi Singkat</label>
                <textarea 
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleModalChange}
                  rows="3"
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={closeModal}
                  style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={modalLoading}
                  style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Datasets;
