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

router.post('/upload-image', authenticateToken, uploadImage.single('gambar_file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File gambar tidak ditemukan.' });
  }
  const fileUrl = `http://localhost:3001/images/Uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
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
    no_inventarisasi: '',
    nama_koleksi: nama_koleksi,
    klasifikasi: klasifikasi,
    sub_klasifikasi: '',
    deskripsi: deskripsi || '',
    tempat_pembuatan: '',
    tempat_perolehan: '',
    cara_perolehan: '',
    tahun_masuk: '',
    dimensi: { panjang: '', lebar: '', tinggi: '', tebal: '', diameter: '', berat: '' },
    tempat_penyimpanan: '',
    kondisi: '',
    tanggal_pengamatan: '',
    nama_petugas: req.body.nama_petugas || 'Admin Manual',
    acuan: '',
    keterangan: '',
    gambar: gambar || null,
    source_pdf: 'Input Manual',
    tanggal_input: new Date().toISOString()
  };

  data.unshift(newItem); // Tambahkan ke paling atas
  saveCollections(data);

  console.log(`[Admin] Artefak dibuat manual: ${nama_koleksi} (ID: ${newItem.id})`);
  res.status(201).json({ message: 'Dataset berhasil ditambahkan secara manual.', item: newItem });
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

  data[index].nama_koleksi = nama_koleksi;
  data[index].no_registrasi = no_registrasi;
  data[index].klasifikasi = klasifikasi;
  if (deskripsi !== undefined) data[index].deskripsi = deskripsi;
  if (gambar !== undefined) data[index].gambar = gambar || null;

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

  console.log(`[Admin] Artefak dihapus: ID ${id}`);
  res.json({ message: 'Dataset berhasil dihapus.', item: deletedItem[0] });
});

module.exports = router;
