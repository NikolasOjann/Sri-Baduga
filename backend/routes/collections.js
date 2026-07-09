/**
 * routes/collections.js
 * REST API untuk data koleksi museum Sri Baduga
 *
 * Endpoints:
 *   GET /api/collections                             - Semua koleksi (support ?klasifikasi= & ?search=)
 *   GET /api/collections/:id                         - Detail 1 artefak
 *   GET /api/collections/kategori/:nama              - Filter by kategori
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const Fuse    = require('fuse.js');

const DATA_FILE = path.join(__dirname, '..', 'data', 'collections.json');

// Helper: baca data JSON (dengan fallback jika belum ada)
function loadCollections() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ============================================================
// GET /api/collections
// Query params opsional:
//   ?klasifikasi=Etnografika
//   ?search=golok
//   ?page=1&limit=20
// ============================================================
router.get('/', (req, res) => {
  let data = loadCollections();

  const { klasifikasi, search, page = 1, limit = 20 } = req.query;

  // Filter by klasifikasi
  if (klasifikasi) {
    data = data.filter(
      item => item.klasifikasi.toLowerCase() === klasifikasi.toLowerCase()
    );
  }

  // Fuzzy search by nama_koleksi atau deskripsi
  if (search) {
    const fuse = new Fuse(data, {
      keys: ['nama_koleksi', 'deskripsi', 'keterangan'],
      threshold: 0.4,
    });
    data = fuse.search(search).map(r => r.item);
  }

  // Pagination
  const total    = data.length;
  const pageNum  = parseInt(page);
  const limitNum = parseInt(limit);
  const start    = (pageNum - 1) * limitNum;
  const paginated = data.slice(start, start + limitNum);

  res.json({
    total,
    page:  pageNum,
    limit: limitNum,
    data:  paginated,
  });
});

// ============================================================
// GET /api/collections/kategori/:nama
// Contoh: /api/collections/kategori/Etnografika
// ============================================================
router.get('/kategori/:nama', (req, res) => {
  const data = loadCollections();
  const { nama } = req.params;

  const filtered = data.filter(
    item => item.klasifikasi.toLowerCase() === nama.toLowerCase()
  );

  res.json({
    kategori: nama,
    total:    filtered.length,
    data:     filtered,
  });
});

// ============================================================
// GET /api/collections/:id
// Harus di bawah route '/kategori/:nama' agar tidak bentrok
// ============================================================
router.get('/:id', (req, res) => {
  const data = loadCollections();
  const id   = parseInt(req.params.id);

  const item = data.find(c => c.id === id);
  if (!item) {
    return res.status(404).json({ error: `Artefak dengan id ${id} tidak ditemukan.` });
  }

  res.json(item);
});

module.exports = router;
