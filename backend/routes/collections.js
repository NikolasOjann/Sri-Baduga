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
    const data = JSON.parse(raw);
    return data.filter(item => item && item.gambar && typeof item.gambar === 'string' && item.gambar.trim() !== '' && item.gambar !== 'null' && item.is_public !== false && item.is_public !== 'false');
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
      keys: ['nama_koleksi', 'sub_klasifikasi', 'deskripsi', 'keterangan'],
      threshold: 0.4,
    });
    data = fuse.search(search).map(r => r.item);
  }

  // Pagination
  const total    = data.length;
  const pageNum  = parseInt(page);
  const limitNum = parseInt(limit);
  const start    = (pageNum - 1) * limitNum;
  let paginated = data.slice(start, start + limitNum);

  // Dynamically rewrite relative URLs using the request's hostname
  const base = `${req.protocol}://${req.hostname}:3001`;
  paginated = paginated.map(item => ({
    ...item,
    gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
    model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
  }));

  res.json({
    total,
    page:  pageNum,
    limit: limitNum,
    data:  paginated,
  });
});

// ============================================================
// GET /api/collections/stats/counts
// ============================================================
router.get('/stats/counts', (req, res) => {
  const data = loadCollections();
  const counts = {};
  data.forEach(item => {
    let k = (item.klasifikasi || 'Lainnya').trim();
    if (k.toLowerCase() === 'etnografi') k = 'Etnografika';
    counts[k] = (counts[k] || 0) + 1;
  });
  res.json(counts);
});

// ============================================================
// GET /api/collections/kategori/:nama
// Contoh: /api/collections/kategori/Etnografika
// ============================================================
router.get('/kategori/:nama', (req, res) => {
  const data = loadCollections();
  const { nama } = req.params;

  let filtered = data.filter(item => {
    const k = (item.klasifikasi || '').toLowerCase();
    const target = nama.toLowerCase();
    return k === target || (target === 'etnografika' && k === 'etnografi');
  });

  const base = `${req.protocol}://${req.hostname}:3001`;
  filtered = filtered.map(item => ({
    ...item,
    gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
    model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
  }));

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
  const paramId = req.params.id;
  const numId = parseInt(paramId);

  const item = data.find(c => c.id === numId || String(c.id) === String(paramId));
  if (!item) {
    return res.status(404).json({ error: `Artefak dengan id ${paramId} tidak ditemukan.` });
  }

  const base = `${req.protocol}://${req.hostname}:3001`;
  if (item.gambar && item.gambar.startsWith('/')) item.gambar = base + item.gambar;
  if (item.model_3d && item.model_3d.startsWith('/')) item.model_3d = base + item.model_3d;

  res.json(item);
});

module.exports = router;

