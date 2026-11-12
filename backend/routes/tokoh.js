const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'tokoh');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tokoh-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET /api/tokoh (Publik - Ambil tokoh utama, kita ambil yang pertama aja untuk saat ini)
router.get('/', async (req, res) => {
  try {
    const tokoh = await prisma.tokohSejarah.findFirst({
      orderBy: { id: 'asc' }
    });
    res.json(tokoh || null);
  } catch (error) {
    console.error('Error fetching tokoh:', error);
    res.status(500).json({ error: 'Gagal mengambil data tokoh' });
  }
});

// GET /api/tokoh/admin (Admin - Ambil semua tokoh)
router.get('/admin', async (req, res) => {
  try {
    const tokohList = await prisma.tokohSejarah.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(tokohList);
  } catch (error) {
    console.error('Error fetching tokoh list:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar tokoh' });
  }
});

// POST /api/tokoh (Admin - Tambah tokoh)
router.post('/', upload.single('foto_utama'), async (req, res) => {
  try {
    const { nama, label, tahun, quote, deskripsi, video, masa, kerajaan, warisan } = req.body;
    let fotoUrl = null;
    if (req.file) {
      fotoUrl = `/images/tokoh/${req.file.filename}`;
    }

    const newTokoh = await prisma.tokohSejarah.create({
      data: {
        nama,
        label,
        tahun,
        quote,
        deskripsi,
        foto_utama: fotoUrl,
        video,
        masa,
        kerajaan,
        warisan
      }
    });
    res.status(201).json(newTokoh);
  } catch (error) {
    console.error('Error creating tokoh:', error);
    res.status(500).json({ error: 'Gagal menambahkan tokoh' });
  }
});

// PUT /api/tokoh/:id (Admin - Edit tokoh)
router.put('/:id', upload.single('foto_utama'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, label, tahun, quote, deskripsi, video, masa, kerajaan, warisan } = req.body;
    
    // Cek apakah ada file baru
    let fotoUrl = undefined;
    if (req.file) {
      fotoUrl = `/images/tokoh/${req.file.filename}`;
      
      // Opsional: Hapus foto lama di filesystem
      // const oldTokoh = await prisma.tokohSejarah.findUnique({ where: { id: parseInt(id) } });
      // if (oldTokoh && oldTokoh.foto_utama) { ... hapus file lama ... }
    }

    const updatedTokoh = await prisma.tokohSejarah.update({
      where: { id: parseInt(id) },
      data: {
        nama,
        label,
        tahun,
        quote,
        deskripsi,
        video,
        masa,
        kerajaan,
        warisan,
        ...(fotoUrl !== undefined && { foto_utama: fotoUrl })
      }
    });
    res.json(updatedTokoh);
  } catch (error) {
    console.error('Error updating tokoh:', error);
    res.status(500).json({ error: 'Gagal mengupdate tokoh' });
  }
});

// DELETE /api/tokoh/:id (Admin - Hapus tokoh)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tokohSejarah.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Tokoh berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting tokoh:', error);
    res.status(500).json({ error: 'Gagal menghapus tokoh' });
  }
});

module.exports = router;
