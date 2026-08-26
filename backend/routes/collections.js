/**
 * routes/collections.js
 * REST API untuk data koleksi museum Sri Baduga
 */
const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const myCache = require('../utils/cache');

// Helper: dapatkan Base URL (Prioritaskan .env, lalu req.get('host'))
const getBaseUrl = (req) => {
  return process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

// ============================================================
// GET /api/collections
// Query params opsional:
//   ?klasifikasi=Etnografika
//   ?search=golok
//   ?page=1&limit=20
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { klasifikasi, search, page = 1, limit = 20 } = req.query;
    
    const cacheKey = `collections_${klasifikasi || ''}_${search || ''}_${page}_${limit}`;
    const cached = myCache.get(cacheKey);
    if (cached) return res.json(cached);

    // Bangun where clause (hanya public data)
    const where = { is_public: true };
    
    if (klasifikasi) {
      where.klasifikasi = {
        equals: klasifikasi,
        mode: 'insensitive' // Untuk case-insensitive PostgreSQL
      };
    }
    
    if (search) {
      where.OR = [
        { nama_koleksi: { contains: search, mode: 'insensitive' } },
        { sub_klasifikasi: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { keterangan: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const pageNum  = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip     = (pageNum - 1) * limitNum;
    
    // Ambil data dan total
    const [data, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: 'asc' }
      }),
      prisma.collection.count({ where })
    ]);
    
    // Dynamically rewrite relative URLs using the request's hostname
    const base = getBaseUrl(req);
    const paginated = data.map(item => {
      const formatted = {
        ...item,
        gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
        model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
      };
      // Pre-warm cache untuk detail masing-masing item
      myCache.set(`detail_${item.id}`, formatted, 300);
      return formatted;
    });

    const responseData = {
      total,
      page:  pageNum,
      limit: limitNum,
      data:  paginated,
    };
    
    myCache.set(cacheKey, responseData, 300); // cache 5 menit
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// ============================================================
// GET /api/collections/stats/counts
// ============================================================
router.get('/stats/counts', async (req, res) => {
  try {
    const cached = myCache.get('stats_counts');
    if (cached) return res.json(cached);

    const data = await prisma.collection.findMany({
      where: { is_public: true },
      select: { klasifikasi: true }
    });
    
    const counts = {};
    data.forEach(item => {
      let k = (item.klasifikasi || 'Lainnya').trim();
      if (k.toLowerCase() === 'etnografi') k = 'Etnografika';
      counts[k] = (counts[k] || 0) + 1;
    });
    
    myCache.set('stats_counts', counts, 300);
    res.json(counts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// ============================================================
// GET /api/collections/kategori/:nama
// ============================================================
router.get('/kategori/:nama', async (req, res) => {
  try {
    const { nama } = req.params;
    const target = nama.toLowerCase();
    
    const cached = myCache.get(`kategori_${target}`);
    if (cached) return res.json(cached);

    // Kalau targetnya etnografika, cari Etnografika ATAU Etnografi
    let whereClause = {};
    if (target === 'etnografika') {
      whereClause = {
        is_public: true,
        OR: [
          { klasifikasi: { equals: 'Etnografika', mode: 'insensitive' } },
          { klasifikasi: { equals: 'Etnografi', mode: 'insensitive' } }
        ]
      };
    } else {
      whereClause = {
        is_public: true,
        klasifikasi: { equals: nama, mode: 'insensitive' }
      };
    }
    
    const data = await prisma.collection.findMany({ where: whereClause });
    
    const base = getBaseUrl(req);
    const filtered = data.map(item => {
      const formatted = {
        ...item,
        gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
        model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
      };
      // Pre-warm cache agar pas di-klik halamannya langsung kebuka instan!
      myCache.set(`detail_${item.id}`, formatted, 300);
      return formatted;
    });
    
    const responseData = {
      kategori: nama,
      total:    filtered.length,
      data:     filtered,
    };
    
    myCache.set(`kategori_${target}`, responseData, 300);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// ============================================================
// GET /api/collections/:id
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const numId = parseInt(req.params.id);
    if (isNaN(numId)) {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    
    const cached = myCache.get(`detail_${numId}`);
    if (cached) return res.json(cached);

    const item = await prisma.collection.findUnique({
      where: { id: numId }
    });
    
    if (!item) {
      return res.status(404).json({ error: `Artefak dengan id ${numId} tidak ditemukan.` });
    }

    const base = getBaseUrl(req);
    if (item.gambar && item.gambar.startsWith('/')) item.gambar = base + item.gambar;
    if (item.model_3d && item.model_3d.startsWith('/')) item.model_3d = base + item.model_3d;

    myCache.set(`detail_${numId}`, item, 300);
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;

// ============================================================
// AUTO PRE-WARM CACHE (Jalan otomatis saat server start)
// ============================================================
async function prewarmCache() {
  try {
    console.log('[Cache] Memulai pre-warming cache database di background...');
    
    // Tarik semua data yang public (ini cuma dipanggil 1x saat server start)
    const allData = await prisma.collection.findMany({
      where: { is_public: true },
      orderBy: { id: 'asc' }
    });

    // 1. Cache Stats Counts
    const counts = {};
    allData.forEach(item => {
      let k = (item.klasifikasi || 'Lainnya').trim();
      if (k.toLowerCase() === 'etnografi') k = 'Etnografika';
      counts[k] = (counts[k] || 0) + 1;
    });
    myCache.set('stats_counts', counts, 86400); // cache 24 jam

    // 2. Cache per Kategori & Cache per Detail
    const base = process.env.API_BASE_URL || `http://localhost:3001`; // Default base url untuk local server
    
    // Kelompokkan data berdasarkan klasifikasi
    const grouped = {};
    allData.forEach(item => {
      let k = (item.klasifikasi || 'Lainnya').trim();
      if (k.toLowerCase() === 'etnografi') k = 'Etnografika';
      const kLower = k.toLowerCase();
      if (!grouped[kLower]) grouped[kLower] = [];
      
      const formatted = {
        ...item,
        gambar: (item.gambar && item.gambar.startsWith('/')) ? base + item.gambar : item.gambar,
        model_3d: (item.model_3d && item.model_3d.startsWith('/')) ? base + item.model_3d : item.model_3d
      };
      
      grouped[kLower].push(formatted);
      
      // Cache detail item
      myCache.set(`detail_${item.id}`, formatted, 86400); // cache 24 jam
    });
    
    // Simpan array kategori ke cache
    for (const [kategori, items] of Object.entries(grouped)) {
      myCache.set(`kategori_${kategori}`, {
        kategori: kategori,
        total: items.length,
        data: items
      }, 86400);
    }
    
    console.log(`[Cache] Sukses memuat ${allData.length} koleksi ke RAM memori!`);
  } catch (err) {
    console.error('[Cache Error] Gagal melakukan pre-warming:', err.message);
  }
}

// Jalankan prewarm 2 detik setelah server dinyalakan
setTimeout(prewarmCache, 2000);
