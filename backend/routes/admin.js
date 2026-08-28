const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const myCache = require('../utils/cache');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'sribaduga_rahasia_super_aman_123';

// Konfigurasi Kredensial dari .env (Fallback ke default)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'tegallega1974';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'istimewa1974';

// Helper: dapatkan Base URL (Prioritaskan .env, lalu req.get('host'))
const getBaseUrl = (req) => {
  return process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

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

    const base = getBaseUrl(req);
    const fileUrl = `${base}/images/${folderName}/${finalFilename}?t=${Date.now()}`;
    res.json({ url: fileUrl });
  } catch (err) {
    console.error(`[ERROR] Gagal hapus background: ${err.message}`);
    // Fallback: Jika script AI gagal, pindahkan gambar asli ke folder tujuan
    if (fs.existsSync(originalPath)) fs.renameSync(originalPath, fallbackPath);
    
    const base = getBaseUrl(req);
    const fileUrl = `${base}/images/${folderName}/${fallbackFilename}?t=${Date.now()}`;
    res.json({ url: fileUrl });
  }
});

// ==========================================================
// Konfigurasi & Endpoint Upload Model 3D (Manual)
// ==========================================================
const modelUploadDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(modelUploadDir)) {
  fs.mkdirSync(modelUploadDir, { recursive: true });
}

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, modelUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'model-' + Date.now() + path.extname(file.originalname).toLowerCase());
  }
});

const uploadModel = multer({
  storage: modelStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.glb' || ext === '.gltf') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .glb atau .gltf yang diperbolehkan.'));
    }
  }
});

router.post('/upload-model', authenticateToken, uploadModel.single('model_file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File model 3D tidak ditemukan.' });
  }
  
  const finalFilename = req.file.filename;
  const fileUrl = `/models/${finalFilename}`; // Simpan relative path saja, frontend/backend akan nambahin domain
  
  // Hapus model lama jika ada
  if (req.body.old_model) {
    try {
      const urlParts = req.body.old_model.split('/models/');
      if (urlParts.length === 2) {
        const oldFilePath = path.join(__dirname, '..', 'public', 'models', urlParts[1]);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`[Admin] Berhasil menghapus file model lama: ${urlParts[1]}`);
        }
      }
    } catch (err) {
      console.error(`[Admin] Gagal menghapus model lama: ${err.message}`);
    }
  }
  
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
// FUNGSI HELPER: Sync RAG
// ==========================================================
function syncRagDatabase() {
  try {
    const ragUrl = process.env.RAG_URL || 'http://127.0.0.1:8000';
    fetch(`${ragUrl}/admin/reindex`, { method: 'POST' })
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
router.post('/datasets', authenticateToken, async (req, res) => {
  try {
    const { nama_koleksi, no_registrasi, klasifikasi, deskripsi, gambar } = req.body;
    if (!nama_koleksi || !no_registrasi || !klasifikasi) {
      return res.status(400).json({ error: 'Nama Koleksi, No Registrasi, dan Klasifikasi wajib diisi.' });
    }

    const newItem = await prisma.collection.create({
      data: {
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
        model_3d: req.body.model_3d || null,
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
      }
    });

    syncRagDatabase();
    myCache.clear(); // Hapus cache agar API publik terupdate
    console.log(`[Admin] Artefak dibuat manual: ${nama_koleksi} (ID: ${newItem.id})`);
    res.status(201).json({ message: 'Dataset berhasil ditambahkan secara manual.', item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat dataset.' });
  }
});

// ==========================================================
// Endpoint: GET Admin Stats
// ==========================================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const data = await prisma.collection.findMany();
    
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// ==========================================================
// Endpoint: GET Admin Datasets (All records + support search & filters)
// ==========================================================
router.get('/datasets', authenticateToken, async (req, res) => {
  try {
    const { klasifikasi, search, pengadaan, publikasi } = req.query;
    
    const where = {};

    if (klasifikasi) {
      where.klasifikasi = { equals: klasifikasi, mode: 'insensitive' };
    }

    if (pengadaan && pengadaan.toLowerCase() !== 'semua') {
      where.jenis_pengadaan = { equals: pengadaan, mode: 'insensitive' };
    }
    
    if (publikasi && publikasi !== 'semua') {
      if (publikasi === 'publik') {
        where.is_public = true;
      } else if (publikasi === 'private') {
        where.is_public = false;
      }
    }

    if (search) {
      where.OR = [
        { nama_koleksi: { contains: search, mode: 'insensitive' } },
        { sub_klasifikasi: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { keterangan: { contains: search, mode: 'insensitive' } },
        { no_inventarisasi: { contains: search, mode: 'insensitive' } },
        { no_registrasi: { contains: search, mode: 'insensitive' } }
      ];
    }

    let data = await prisma.collection.findMany({ where, orderBy: { id: 'desc' } });

    const base = getBaseUrl(req);
    data = data.map(item => ({
      ...item,
      gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
      model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
    }));

    res.json({ total: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// ==========================================================
// Endpoint: GET Admin Dataset by ID
// ==========================================================
router.get('/datasets/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.collection.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: 'Dataset tidak ditemukan.' });
    }

    const base = getBaseUrl(req);
    const formattedItem = {
      ...item,
      gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
      model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
    };

    res.json(formattedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// ==========================================================
// Endpoint: UPDATE Dataset
// ==========================================================
router.put('/datasets/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nama_koleksi, no_registrasi, klasifikasi, deskripsi, gambar } = req.body;

    if (!nama_koleksi || !no_registrasi || !klasifikasi) {
      return res.status(400).json({ error: 'Nama Koleksi, No Registrasi, dan Klasifikasi wajib diisi.' });
    }

    const existingItem = await prisma.collection.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({ error: 'Dataset tidak ditemukan.' });
    }

    const updateData = {
      nama_koleksi,
      no_registrasi,
      klasifikasi,
    };
    
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (req.body.no_inventarisasi !== undefined) updateData.no_inventarisasi = req.body.no_inventarisasi;
    if (req.body.tanggal_registrasi !== undefined) updateData.tanggal_registrasi = req.body.tanggal_registrasi;
    if (req.body.no_registrasi_nasional !== undefined) updateData.no_registrasi_nasional = req.body.no_registrasi_nasional;
    if (req.body.tanggal_inventarisasi !== undefined) updateData.tanggal_inventarisasi = req.body.tanggal_inventarisasi;
    if (req.body.status_cb !== undefined) updateData.status_cb = req.body.status_cb;
    if (req.body.tanggal_perolehan !== undefined) updateData.tanggal_perolehan = req.body.tanggal_perolehan;
    if (req.body.cara_pembuatan !== undefined) updateData.cara_pembuatan = req.body.cara_pembuatan;
    if (req.body.cara_perolehan !== undefined) updateData.cara_perolehan = req.body.cara_perolehan;
    if (req.body.tahun_masuk !== undefined) updateData.tahun_masuk = req.body.tahun_masuk;
    if (req.body.dimensi !== undefined) updateData.dimensi = req.body.dimensi;
    if (req.body.tempat_penyimpanan !== undefined) updateData.tempat_penyimpanan = req.body.tempat_penyimpanan;
    if (req.body.kondisi !== undefined) updateData.kondisi = req.body.kondisi;
    if (req.body.tanggal_pengamatan !== undefined) updateData.tanggal_pengamatan = req.body.tanggal_pengamatan;
    if (req.body.acuan !== undefined) updateData.acuan = req.body.acuan;
    if (req.body.keterangan !== undefined) updateData.keterangan = req.body.keterangan;
    if (req.body.dokumentasi !== undefined) updateData.dokumentasi = req.body.dokumentasi;
    if (req.body.pemilik_koleksi !== undefined) updateData.pemilik_koleksi = req.body.pemilik_koleksi;
    if (req.body.jenis_pengadaan !== undefined) updateData.jenis_pengadaan = req.body.jenis_pengadaan;
    if (req.body.lokasi_provinsi !== undefined) updateData.lokasi_provinsi = req.body.lokasi_provinsi;
    if (req.body.lokasi_kabupaten !== undefined) updateData.lokasi_kabupaten = req.body.lokasi_kabupaten;
    if (req.body.latitude !== undefined) updateData.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updateData.longitude = req.body.longitude;
    if (req.body.estimasi_harga !== undefined) updateData.estimasi_harga = req.body.estimasi_harga;
    if (req.body.tim_pengkaji !== undefined) updateData.tim_pengkaji = req.body.tim_pengkaji;
    if (req.body.sejarah !== undefined) updateData.sejarah = req.body.sejarah;
    if (req.body.is_public !== undefined) updateData.is_public = (req.body.is_public === 'true' || req.body.is_public === true);
    if (req.body.model_3d !== undefined) updateData.model_3d = req.body.model_3d;

    if (gambar !== undefined) {
      updateData.gambar = gambar || null;
      
      const oldGambar = existingItem.gambar;
      if (oldGambar && oldGambar !== gambar) {
        try {
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

    const updatedItem = await prisma.collection.update({
      where: { id },
      data: updateData
    });

    syncRagDatabase();
    myCache.clear(); // Hapus cache agar API publik terupdate
    console.log(`[Admin] Artefak diupdate: ID ${id}`);
    res.json({ message: 'Dataset berhasil diperbarui.', item: updatedItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat update dataset.' });
  }
});

// ==========================================================
// Endpoint: DELETE Dataset
// ==========================================================
router.delete('/datasets/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existingItem = await prisma.collection.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({ error: 'Dataset tidak ditemukan.' });
    }

    await prisma.collection.delete({ where: { id } });

    // Hapus file gambar yang terkait dengan dataset yang dihapus
    const gambar = existingItem.gambar;
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

    const model_3d = existingItem.model_3d;
    if (model_3d) {
      try {
        const urlParts = model_3d.split('/models/');
        if (urlParts.length === 2) {
          const oldFilePath = path.join(__dirname, '..', 'public', 'models', urlParts[1]);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`[Admin] Berhasil menghapus file model dataset yang didelete: ${urlParts[1]}`);
          }
        }
      } catch (err) {
        console.error(`[Admin] Gagal menghapus file model: ${err.message}`);
      }
    }

    syncRagDatabase();
    myCache.clear(); // Hapus cache agar API publik terupdate
    console.log(`[Admin] Artefak dihapus: ID ${id}`);
    res.json({ message: 'Dataset berhasil dihapus.', item: existingItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus dataset.' });
  }
});

module.exports = router;
