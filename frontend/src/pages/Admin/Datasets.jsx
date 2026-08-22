import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, PlusCircle, Search, Filter, MoreVertical, Edit, Trash2, Eye, Image as ImageIcon } from 'lucide-react';

function Datasets() {
  const navigate = useNavigate();
  const location = useLocation();
  // ================= State Upload PDF =================
  const [file, setFile] = useState(null);
  const [idPetugas, setIdPetugas] = useState('');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });
  
  // ================= State Data Table =================
  const [datasets, setDatasets] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ================= State Search & Filter =================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('');
  const [filterPengadaan, setFilterPengadaan] = useState('');
  const [filterPublikasi, setFilterPublikasi] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ================= State Table Dropdown =================
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // ================= State Modal CRUD =================
  // (Modal diganti dengan halaman khusus, hapus state modal)

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
    const token = localStorage.getItem('adminToken');
    try {
      let url = ('http://' + window.location.hostname + ':3001/api/admin/datasets?limit=100');
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterKlasifikasi) url += `&klasifikasi=${encodeURIComponent(filterKlasifikasi)}`;
      if (filterPengadaan) url += `&pengadaan=${encodeURIComponent(filterPengadaan)}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    // Cek apakah ada query search dari navbar atas (AdminLayout)
    const params = new URLSearchParams(location.search);
    const qSearch = params.get('search');
    
    // Jika ada query param dari URL, pakai itu. Kalau tidak, gunakan state pencarian yang sudah ada.
    const searchVal = qSearch !== null ? qSearch : searchTerm;
    if (qSearch !== null && qSearch !== searchTerm) {
      setSearchTerm(qSearch);
    }

    setLoadingData(true);
    const token = localStorage.getItem('adminToken');
    
    let url = ('http://' + window.location.hostname + ':3001/api/admin/datasets?limit=100');
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
    if (filterKlasifikasi) url += `&klasifikasi=${encodeURIComponent(filterKlasifikasi)}`;
    if (filterPengadaan) url += `&pengadaan=${encodeURIComponent(filterPengadaan)}`;
    if (filterPublikasi) url += `&publikasi=${encodeURIComponent(filterPublikasi)}`;

    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDatasets(data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoadingData(false));

  }, [location.search]); // Trigger fetch saat ada perubahan di parameter URL (misalnya pencarian dari navbar)

  // ================= Handlers Upload PDF =================
  const removeFile = () => setFile(null);

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
      const res = await fetch(('http://' + window.location.hostname + ':3001/api/admin/datasets/upload'), {
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
    navigate('/1974-SriBaduga/dashboard/datasets/create');
  };

  const openEditModal = (item) => {
    navigate(`/1974-SriBaduga/dashboard/datasets/edit/${item.id}`);
  };



  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus data "${nama}"? Data yang dihapus tidak bisa dikembalikan.`)) {
      return;
    }
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/admin/datasets/${id}`, {
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
          flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '8px', 
          borderTop: '4px solid #007bff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: 0, color: '#1E1E1E', fontSize: '18px' }}>Tambah via Upload PDF</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Unggah file PDF baru untuk diekstrak otomatis menggunakan AI.
          </p>

          {message && <div style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} /> {message}</div>}
          {error && <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}

          <form onSubmit={handleUpload}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '14px' }}>ID Petugas</label>
                <input 
                  type="text" 
                  placeholder="Contoh: PTG-001"
                  value={idPetugas}
                  onChange={(e) => setIdPetugas(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '14px' }}>Nama Petugas</label>
                <input 
                  type="text" 
                  placeholder="Nama Lengkap"
                  value={namaPetugas}
                  onChange={(e) => setNamaPetugas(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '14px' }}>File PDF Dataset</label>
              
              <div 
                {...getRootProps()} 
                style={{
                  border: `2px dashed ${isDragActive ? '#007bff' : '#cbd5e1'}`,
                  backgroundColor: isDragActive ? '#f0f9ff' : '#f8fafc',
                  borderRadius: '8px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input {...getInputProps()} />
                {!file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <UploadCloud size={40} color={isDragActive ? '#007bff' : '#94a3b8'} />
                    <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
                      {isDragActive ? 'Lepaskan file di sini...' : 'Tarik & lepas file PDF di sini, atau klik untuk memilih file'}
                    </p>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Hanya mendukung file .pdf</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <FileText size={32} color="#007bff" />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1e293b' }}>{file.name}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
              </div>
              {file && (
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Hapus File</button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading || !file}
              style={{ 
                width: '100%',
                padding: '12px', 
                backgroundColor: (loading || !file) ? '#94a3b8' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: (loading || !file) ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Mengunggah & Mengekstrak...
                </>
              ) : 'Unggah & Ekstrak'}
            </button>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </form>
        </div>

        {/* Panel Tambah Manual */}
        <div style={{ 
          flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '8px', 
          borderTop: '4px solid #C4A46C', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ marginTop: 0, color: '#1E1E1E', fontSize: '18px' }}>Tambah Data Manual</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
            Jika Anda tidak memiliki dokumen PDF, Anda bisa menambahkan artefak baru secara manual dengan mengisi form terstruktur untuk disimpan langsung ke database.
          </p>
          <div style={{ flex: 1 }}></div>
          <button 
            onClick={openCreateModal}
            style={{ 
              width: '100%',
              padding: '12px', 
              backgroundColor: 'transparent', 
              color: '#333', 
              border: '1px solid #cbd5e1', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <PlusCircle size={20} color="#64748b" />
            Isi Form Data Manual
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
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan No Inventaris atau Nama Koleksi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchDatasets()}
              style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ 
                padding: '10px 15px', backgroundColor: isFilterOpen ? '#f1f5f9' : 'white', color: '#334155', border: '1px solid #cbd5e1', 
                borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' 
              }}
            >
              <Filter size={18} />
              Filter Data
            </button>
            
            {/* Popover Filter */}
            {isFilterOpen && (
              <div style={{ 
                position: 'absolute', top: '110%', right: '0', backgroundColor: 'white', padding: '20px', 
                borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #e2e8f0', width: '300px', zIndex: 100 
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#495057', fontWeight: 'bold' }}>Klasifikasi</label>
                  <select 
                    value={filterKlasifikasi}
                    onChange={(e) => setFilterKlasifikasi(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">- Semua -</option>
                    {standardCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#495057', fontWeight: 'bold' }}>Jenis Pengadaan</label>
                  <select 
                    value={filterPengadaan}
                    onChange={(e) => setFilterPengadaan(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">- Semua -</option>
                    <option value="Hibah">Hibah</option>
                    <option value="Imbalan Jasa">Imbalan Jasa</option>
                    <option value="Pinjaman">Pinjaman</option>
                    <option value="Titipan">Titipan</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#495057', fontWeight: 'bold' }}>Status Publikasi</label>
                  <select 
                    value={filterPublikasi}
                    onChange={(e) => setFilterPublikasi(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">- Semua -</option>
                    <option value="publik">Publik</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => { setFilterKlasifikasi(''); setFilterPengadaan(''); setFilterPublikasi(''); }}
                    style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >Reset</button>
                  <button 
                    onClick={() => { fetchDatasets(); setIsFilterOpen(false); }}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >Terapkan</button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={fetchDatasets}
            style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cari
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={handleBulkDelete}
              style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Hapus Terpilih ({selectedIds.length})
            </button>
          </div>
        )}
        
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
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>No Inventaris</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nama Koleksi</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Klasifikasi</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Publikasi</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {datasets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data</td>
                  </tr>
                ) : (
                  datasets.map((item) => {
                    let badgeBg = '#e2e8f0';
                    let badgeColor = '#475569';
                    const kls = (item.klasifikasi || '').toLowerCase();
                    if (kls === 'etnografika' || kls === 'etnografi') { badgeBg = '#fef3c7'; badgeColor = '#d97706'; } // Amber
                    else if (kls === 'arkeologika') { badgeBg = '#dcfce7'; badgeColor = '#166534'; } // Sage/Green
                    else if (kls === 'historika') { badgeBg = '#dbeafe'; badgeColor = '#1e3a8a'; } // Blue
                    else if (kls === 'geologika') { badgeBg = '#f3e8ff'; badgeColor = '#7e22ce'; } // Purple
                    else if (kls === 'biologika') { badgeBg = '#ecfccb'; badgeColor = '#3f6212'; } // Lime

                    return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                        />
                      </td>
                      <td style={{ padding: '15px 12px', color: '#64748b' }}>#{item.id}</td>
                      <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                        {item.gambar ? (
                          <img src={item.gambar} alt="Thumbnail" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px 12px', color: '#475569', fontWeight: '500' }}>{item.no_inventarisasi || '-'}</td>
                      <td style={{ padding: '15px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.nama_koleksi}</td>
                      <td style={{ padding: '15px 12px' }}>
                        <span style={{ 
                          backgroundColor: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                        }}>
                          {item.klasifikasi}
                        </span>
                      </td>
                      <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                        {item.is_public !== false ? (
                          <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Publik</span>
                        ) : (
                          <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Private</span>
                        )}
                      </td>
                      <td style={{ padding: '15px 12px', textAlign: 'center', position: 'relative' }}>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <MoreVertical size={20} color="#64748b" />
                        </button>
                        
                        {openDropdownId === item.id && (
                          <div style={{ 
                            position: 'absolute', right: '40px', top: '20px', backgroundColor: 'white', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
                            borderRadius: '6px', border: '1px solid #e2e8f0', zIndex: 10, minWidth: '120px', overflow: 'hidden'
                          }}>
                            <button 
                              onClick={() => { openEditModal(item); setOpenDropdownId(null); }}
                              style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            ><Edit size={14} /> Edit</button>
                            <button 
                              onClick={() => { window.open('/interactive/' + item.id, '_blank'); setOpenDropdownId(null); }}
                              style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            ><Eye size={14} /> Lihat Review</button>
                            <button 
                              onClick={() => { handleDelete(item.id, item.nama_koleksi); setOpenDropdownId(null); }}
                              style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            ><Trash2 size={14} /> Hapus</button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Datasets;
