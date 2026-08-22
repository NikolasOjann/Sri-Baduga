const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'sribaduga_rahasia_super_aman_123';

// Konfigurasi Kredensial Hardcode (Sesuai Permintaan)
const ADMIN_USERNAME = 'tegallega1974';
const ADMIN_PASSWORD = 'istimewa1974';

// Konfigurasi Multer untuk Upload PDF
const uploadDir = path.join(__dirname, '..', 'data', 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tambahkan timestamp agar tidak menimpa file dengan nama sama
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF yang diperbolehkan.'));
    }
  }
});

// ==========================================================
// Endpoint: LOGIN
// ==========================================================
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Generate Token
    const token = jwt.sign({ username: ADMIN_USERNAME, role: 'admin' }, SECRET_KEY, { expiresIn: '8h' });
    return res.json({ message: 'Login berhasil', token });
  }

  return res.status(401).json({ error: 'Username atau password salah.' });
});

// ==========================================================
// Konfigurasi & Endpoint Upload Gambar (Manual)
// ==========================================================
const imgUploadDir = path.join(__dirname, '..', 'public', 'images', 'Uploads');
if (!fs.existsSync(imgUploadDir)) {
  fs.mkdirSync(imgUploadDir, { recursive: true });
}

const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'manual-' + Date.now() + path.extname(file.originalname).toLowerCase());
  }
});

const uploadImage = multer({
  storage: imgStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan.'));
    }
  }
});

const mapKlasifikasiToFolder = (klasifikasi) => {
  if (!klasifikasi) return 'Uploads';
  const k = klasifikasi.toLowerCase();
  if (k.includes('arkeo')) return 'arkeo';
  if (k.includes('etno')) return 'etno';
  if (k.includes('geo')) return 'geo';
  if (k.includes('bio')) return 'bio';
  if (k.includes('histo')) return 'histo';
  if (k.includes('numis')) return 'numis';
  if (k.includes('filo')) return 'filo';
  if (k.includes('keramo')) return 'keramo';
  if (k.includes('seni')) return 'senirupa';
  if (k.includes('tekno')) return 'tekno';
  return 'Uploads';
};

router.post('/upload-image', authenticateToken, uploadImage.single('gambar_file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File gambar tidak ditemukan.' });
  }
  
  const originalPath = req.file.path;
  
  // Tentukan folder tujuan berdasarkan klasifikasi
  const folderName = mapKlasifikasiToFolder(req.body.klasifikasi);
  const targetDir = path.join(__dirname, '..', 'public', 'images', folderName);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let finalFilename;
  if (req.body.old_gambar) {
    // Gunakan nama file yang sama jika ini adalah mode edit (overwrite)
    const url = new URL(req.body.old_gambar, 'http://localhost');
    const filenameFromUrl = path.basename(url.pathname);
    finalFilename = filenameFromUrl;
  } else {
    // Hitung nomor urut file berdasarkan isi folder
    let maxSeq = 0;
    const files = fs.readdirSync(targetDir);
    files.forEach(f => {
      const match = f.match(new RegExp(`^${folderName}-(\\d+)\\.(png|jpg|jpeg)$`, 'i'));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    finalFilename = `${folderName}-${nextSeq}.png`;
  }
  
  const finalPath = path.join(targetDir, finalFilename);
  const fallbackFilename = finalFilename.replace('.png', path.extname(req.file.originalname).toLowerCase());
  const fallbackPath = path.join(targetDir, fallbackFilename);
  
  const PYTHON_CMD = 'C:\\laragon\\bin\\python\\python-3.10\\python.exe';
  const REMBG_SCRIPT = path.join(__dirname, '..', 'scripts', 'remove-single-bg.py');

  try {
    console.log(`[Admin Upload] Memanggil Python AI Remove BG untuk upload manual (Folder: ${folderName}, File: ${finalFilename})...`);
    // Tunggu proses hapus background selesai secara sinkronus agar bisa return URL
    const { execSync } = require('child_process');
    execSync(`"${PYTHON_CMD}" "${REMBG_SCRIPT}" "${originalPath}" "${finalPath}"`, { stdio: 'pipe' });
    
    // Opsional: Hapus file asli yang belum dihapus backgroundnya untuk menghemat storage
    if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);

    const fileUrl = `http://localhost:3001/images/${folderName}/${finalFilename}?t=${Date.now()}`;
    res.json({ url: fileUrl });
  } catch (err) {
    console.error(`[ERROR] Gagal hapus background: ${err.message}`);
    // Fallback: Jika script AI gagal, pindahkan gambar asli ke folder tujuan
    if (fs.existsSync(originalPath)) fs.renameSync(originalPath, fallbackPath);
    
    const fileUrl = `http://localhost:3001/images/${folderName}/${fallbackFilename}?t=${Date.now()}`;
    res.json({ url: fileUrl });
  }
});

// ==========================================================
// Endpoint: UPLOAD PDF & Ekstrak Data
// Dilindungi oleh authenticateToken
// ==========================================================
router.post('/datasets/upload', authenticateToken, upload.single('pdf_file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File PDF tidak ditemukan dalam request.' });
  }

  // Validasi ID Petugas & Nama Petugas
  const { id_petugas, nama_petugas, tanggal_upload } = req.body;
  if (!id_petugas || !nama_petugas) {
    // Hapus file yang terlanjur diupload multer jika validasi gagal
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'ID Petugas dan Nama Petugas wajib disertakan!' });
  }

  console.log(`[Admin Upload] Petugas: ${nama_petugas} (${id_petugas})`);
  console.log(`[Admin Upload] Tanggal : ${tanggal_upload || new Date().toISOString()}`);
  console.log(`[Admin Upload] Menerima file: ${req.file.filename}`);

  // Menjalankan skrip extract-pdf.js
  const scriptPath = path.join(__dirname, '..', 'scripts', 'extract-pdf.js');
  const command = `node "${scriptPath}"`;

  console.log(`[Admin] Menjalankan pemrosesan dataset: ${command}`);

  exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Admin] Error saat ekstrak PDF: ${error.message}`);
      return res.status(500).json({
        error: 'Gagal memproses file PDF.',
        details: error.message
      });
    }

    console.log(`[Admin] Hasil pemrosesan:\n${stdout}`);

    res.json({
      message: 'File berhasil diunggah dan diproses.',
      filename: req.file.filename,
      output: stdout
    });
  });
});

// ==========================================================
// FUNGSI HELPER: Baca & Simpan JSON
// ==========================================================
const DATA_FILE = path.join(__dirname, '..', 'data', 'collections.json');

function loadCollections() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCollections(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  
  // Sinkronisasi otomatis ke Python RAG (Vector Database)
  try {
    fetch('http://127.0.0.1:8000/admin/reindex', { method: 'POST' })
      .then(res => res.json())
      .then(resData => console.log('[RAG Sync] Database vector berhasil diperbarui secara otomatis:', resData))
      .catch(err => console.error('[RAG Sync Error] Gagal menghubungi Python RAG:', err.message));
  } catch (e) {
    console.error('[RAG Sync Error]', e);
  }
}

// ==========================================================
// Endpoint: CREATE Manual Dataset
// ==========================================================
router.post('/datasets', authenticateToken, (req, res) => {
  const { nama_koleksi, no_registrasi, klasifikasi, deskripsi, gambar } = req.body;
  if (!nama_koleksi || !no_registrasi || !klasifikasi) {
    return res.status(400).json({ error: 'Nama Koleksi, No Registrasi, dan Klasifikasi wajib diisi.' });
  }

  const data = loadCollections();

  // Cari ID terbesar untuk increment
  let maxId = 0;
  data.forEach(item => {
    if (item.id && item.id > maxId) maxId = item.id;
  });

  const newItem = {
    id: maxId + 1,
    no_registrasi: no_registrasi,
    no_inventarisasi: req.body.no_inventarisasi || '',
    nama_koleksi: nama_koleksi,
    klasifikasi: klasifikasi,
    sub_klasifikasi: '',
    tanggal_registrasi: req.body.tanggal_registrasi || '',
    no_registrasi_nasional: req.body.no_registrasi_nasional || '',
    tanggal_inventarisasi: req.body.tanggal_inventarisasi || '',
    status_cb: req.body.status_cb || '',
    tanggal_perolehan: req.body.tanggal_perolehan || '',
    deskripsi: deskripsi || '',
    tempat_pembuatan: '',
    cara_pembuatan: req.body.cara_pembuatan || '',
    tempat_perolehan: '',
    cara_perolehan: req.body.cara_perolehan || '',
    tahun_masuk: req.body.tahun_masuk || '',
    dimensi: req.body.dimensi || { panjang: '', lebar: '', tinggi: '', tebal: '', diameter: '', berat: '', karat: '' },
    tempat_penyimpanan: req.body.tempat_penyimpanan || '',
    kondisi: req.body.kondisi || '',
    tanggal_pengamatan: req.body.tanggal_pengamatan || '',
    nama_petugas: req.body.nama_petugas || 'Admin Manual',
    acuan: req.body.acuan || '',
    keterangan: req.body.keterangan || '',
    gambar: gambar || null,
    dokumentasi: req.body.dokumentasi || [],
    pemilik_koleksi: req.body.pemilik_koleksi || '',
    jenis_pengadaan: req.body.jenis_pengadaan || '',
    lokasi_provinsi: req.body.lokasi_provinsi || '',
    lokasi_kabupaten: req.body.lokasi_kabupaten || '',
    latitude: req.body.latitude || '',
    longitude: req.body.longitude || '',
    estimasi_harga: req.body.estimasi_harga || '',
    tim_pengkaji: req.body.tim_pengkaji || [],
    sejarah: req.body.sejarah || '',
    is_public: req.body.is_public !== undefined ? (req.body.is_public === 'true' || req.body.is_public === true) : true,
    source_pdf: 'Input Manual',
    tanggal_input: new Date().toISOString()
  };

  data.push(newItem); // Tambahkan ke paling bawah
  saveCollections(data);

  console.log(`[Admin] Artefak dibuat manual: ${nama_koleksi} (ID: ${newItem.id})`);
  res.status(201).json({ message: 'Dataset berhasil ditambahkan secara manual.', item: newItem });
});

// ==========================================================
// Endpoint: GET Admin Stats
// ==========================================================
router.get('/stats', authenticateToken, (req, res) => {
  const data = loadCollections();
  
  let publicCount = 0;
  let privateCount = 0;
  let dokumentasiCount = 0;
  
  const standardCategories = [
    'Geologika', 'Biologika', 'Etnografika', 'Arkeologika', 'Historika',
    'Numismatika', 'Filologika', 'Keramologika', 'Seni Rupa', 'Teknologika'
  ];
  
  const counts = {};
  standardCategories.forEach(cat => counts[cat] = 0);
  counts['Lainnya'] = 0;

  data.forEach(item => {
    // Check Public/Private
    if (item.is_public === false || String(item.is_public) === 'false') {
      privateCount++;
    } else {
      publicCount++;
    }

    // Hitung dokumentasi (gambar utama + dokumentasi tambahan)
    if (item.gambar) dokumentasiCount++;
    if (item.dokumentasi && Array.isArray(item.dokumentasi)) {
      dokumentasiCount += item.dokumentasi.length;
    }

    // Check Klasifikasi
    let k = (item.klasifikasi || 'Lainnya').trim();
    if (k.toLowerCase() === 'etnografi') k = 'Etnografika';
    
    const matchedCategory = standardCategories.find(c => c.toLowerCase() === k.toLowerCase());
    if (matchedCategory) {
      counts[matchedCategory]++;
    } else {
      counts['Lainnya']++;
    }
  });

  res.json({
    total: data.length,
    publicCount,
    privateCount,
    dokumentasiCount,
    konservasiCount: 49, // Mockup sesuai UI
    restorasiCount: 1, // Mockup sesuai UI
    penyimpananCount: 1, // Mockup sesuai UI
    klasifikasi: counts
  });
});

// ==========================================================
// Endpoint: GET Admin Datasets (All records + support search & filters)
// ==========================================================
router.get('/datasets', authenticateToken, (req, res) => {
  let data = loadCollections();
  
  const { klasifikasi, search, pengadaan, publikasi } = req.query;

  if (klasifikasi) {
    data = data.filter(item => item.klasifikasi?.toLowerCase() === klasifikasi.toLowerCase());
  }

  if (pengadaan && pengadaan.toLowerCase() !== 'semua') {
    data = data.filter(item => item.jenis_pengadaan?.toLowerCase() === pengadaan.toLowerCase());
  }
  
  if (publikasi && publikasi !== 'semua') {
    if (publikasi === 'publik') {
      data = data.filter(item => item.is_public !== false && item.is_public !== 'false');
    } else if (publikasi === 'private') {
      data = data.filter(item => item.is_public === false || item.is_public === 'false');
    }
  }

  if (search) {
    const Fuse = require('fuse.js');
    const fuse = new Fuse(data, {
      keys: ['nama_koleksi', 'sub_klasifikasi', 'deskripsi', 'keterangan', 'no_inventarisasi', 'no_registrasi'],
      threshold: 0.4,
    });
    data = fuse.search(search).map(r => r.item);
  }

  const base = `${req.protocol}://${req.hostname}:3001`;
  data = data.map(item => ({
    ...item,
    gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
    model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
  }));

  res.json({ total: data.length, data });
});

// ==========================================================
// Endpoint: GET Admin Dataset by ID
// ==========================================================
router.get('/datasets/:id', authenticateToken, (req, res) => {
  const data = loadCollections();
  const idStr = String(req.params.id);
  const item = data.find(d => String(d.id) === idStr);

  if (!item) {
    return res.status(404).json({ error: 'Dataset tidak ditemukan.' });
  }

  const base = `${req.protocol}://${req.hostname}:3001`;
  const formattedItem = {
    ...item,
    gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
    model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
  };

  res.json(formattedItem);
});

// ==========================================================
// Endpoint: UPDATE Dataset
// ==========================================================
router.put('/datasets/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nama_koleksi, no_registrasi, klasifikasi, deskripsi, gambar } = req.body;

  if (!nama_koleksi || !no_registrasi || !klasifikasi) {
    return res.status(400).json({ error: 'Nama Koleksi, No Registrasi, dan Klasifikasi wajib diisi.' });
  }

  const data = loadCollections();
  const index = data.findIndex(item => String(item.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: 'Dataset tidak ditemukan.' });
  }

  const oldGambar = data[index].gambar;

  // Update field lama dan baru
  data[index].nama_koleksi = nama_koleksi;
  data[index].no_registrasi = no_registrasi;
  data[index].klasifikasi = klasifikasi;
  if (deskripsi !== undefined) data[index].deskripsi = deskripsi;
  
  // Field Baru
  if (req.body.no_inventarisasi !== undefined) data[index].no_inventarisasi = req.body.no_inventarisasi;
  if (req.body.tanggal_registrasi !== undefined) data[index].tanggal_registrasi = req.body.tanggal_registrasi;
  if (req.body.no_registrasi_nasional !== undefined) data[index].no_registrasi_nasional = req.body.no_registrasi_nasional;
  if (req.body.tanggal_inventarisasi !== undefined) data[index].tanggal_inventarisasi = req.body.tanggal_inventarisasi;
  if (req.body.status_cb !== undefined) data[index].status_cb = req.body.status_cb;
  if (req.body.tanggal_perolehan !== undefined) data[index].tanggal_perolehan = req.body.tanggal_perolehan;
  if (req.body.cara_pembuatan !== undefined) data[index].cara_pembuatan = req.body.cara_pembuatan;
  if (req.body.cara_perolehan !== undefined) data[index].cara_perolehan = req.body.cara_perolehan;
  if (req.body.tahun_masuk !== undefined) data[index].tahun_masuk = req.body.tahun_masuk;
  if (req.body.dimensi !== undefined) data[index].dimensi = req.body.dimensi;
  if (req.body.tempat_penyimpanan !== undefined) data[index].tempat_penyimpanan = req.body.tempat_penyimpanan;
  if (req.body.kondisi !== undefined) data[index].kondisi = req.body.kondisi;
  if (req.body.tanggal_pengamatan !== undefined) data[index].tanggal_pengamatan = req.body.tanggal_pengamatan;
  if (req.body.acuan !== undefined) data[index].acuan = req.body.acuan;
  if (req.body.keterangan !== undefined) data[index].keterangan = req.body.keterangan;
  if (req.body.dokumentasi !== undefined) data[index].dokumentasi = req.body.dokumentasi;
  if (req.body.pemilik_koleksi !== undefined) data[index].pemilik_koleksi = req.body.pemilik_koleksi;
  if (req.body.jenis_pengadaan !== undefined) data[index].jenis_pengadaan = req.body.jenis_pengadaan;
  if (req.body.lokasi_provinsi !== undefined) data[index].lokasi_provinsi = req.body.lokasi_provinsi;
  if (req.body.lokasi_kabupaten !== undefined) data[index].lokasi_kabupaten = req.body.lokasi_kabupaten;
  if (req.body.latitude !== undefined) data[index].latitude = req.body.latitude;
  if (req.body.longitude !== undefined) data[index].longitude = req.body.longitude;
  if (req.body.estimasi_harga !== undefined) data[index].estimasi_harga = req.body.estimasi_harga;
  if (req.body.tim_pengkaji !== undefined) data[index].tim_pengkaji = req.body.tim_pengkaji;
  if (req.body.sejarah !== undefined) data[index].sejarah = req.body.sejarah;
  if (req.body.is_public !== undefined) data[index].is_public = (req.body.is_public === 'true' || req.body.is_public === true);

  if (gambar !== undefined) {
    data[index].gambar = gambar || null;
    
    // Hapus gambar lama jika ada gambar baru yang berbeda
    if (oldGambar && oldGambar !== gambar) {
      try {
        // Asumsi URL seperti http://localhost:3001/images/folder/file.png
        const urlParts = oldGambar.split('/images/');
        if (urlParts.length === 2) {
          const oldFilePath = path.join(__dirname, '..', 'public', 'images', urlParts[1]);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`[Admin] Berhasil menghapus file gambar lama: ${urlParts[1]}`);
          }
        }
      } catch (err) {
        console.error(`[Admin] Gagal menghapus gambar lama: ${err.message}`);
      }
    }
  }

  saveCollections(data);
  console.log(`[Admin] Artefak diupdate: ID ${id}`);
  res.json({ message: 'Dataset berhasil diperbarui.', item: data[index] });
});

// ==========================================================
// Endpoint: DELETE Dataset
// ==========================================================
router.delete('/datasets/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const data = loadCollections();

  const index = data.findIndex(item => String(item.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Dataset tidak ditemukan.' });
  }

  const deletedItem = data.splice(index, 1);
  saveCollections(data);

  // Hapus file gambar yang terkait dengan dataset yang dihapus
  const gambar = deletedItem[0].gambar;
  if (gambar) {
    try {
      const urlParts = gambar.split('/images/');
      if (urlParts.length === 2) {
        const oldFilePath = path.join(__dirname, '..', 'public', 'images', urlParts[1]);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`[Admin] Berhasil menghapus file gambar dataset yang didelete: ${urlParts[1]}`);
        }
      }
    } catch (err) {
      console.error(`[Admin] Gagal menghapus file gambar: ${err.message}`);
    }
  }

  console.log(`[Admin] Artefak dihapus: ID ${id}`);
  res.json({ message: 'Dataset berhasil dihapus.', item: deletedItem[0] });
});

module.exports = router;
