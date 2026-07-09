/**
 * routes/chat.js
 * Chatbot Nyai — berbasis fuzzy search pada data koleksi JSON
 * (RAG-lite tanpa LLM, siap diganti dengan LLM API di masa depan)
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const Fuse    = require('fuse.js');

const DATA_FILE = path.join(__dirname, '..', 'data', 'collections.json');

// Informasi umum museum (hardcoded, bisa dipindah ke JSON terpisah nanti)
const MUSEUM_INFO = {
  jam_buka: 'Museum Sri Baduga buka setiap Selasa–Minggu, pukul 08.00–16.00 WIB. Senin dan hari libur nasional tutup.',
  lokasi:   'Museum Sri Baduga berlokasi di Jl. BKR No.185, Pelindung Hewan, Kec. Astanaanyar, Kota Bandung, Jawa Barat.',
  tiket:    'Tiket masuk Museum Sri Baduga: Dewasa Rp 5.000, Pelajar/Mahasiswa Rp 3.000, Anak-anak Rp 2.000.',
  telepon:  'Telepon Museum Sri Baduga: (022) 5200–9049.',
  sejarah:  'Museum Sri Baduga diresmikan pada 5 Juni 1980. Nama Sri Baduga diambil dari gelar Raja Pajajaran, Sri Baduga Maharaja, yang membawa masa kejayaan di bumi Pasundan.',
};

// Helper: baca data JSON
function loadCollections() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// Helper: format artefak menjadi kalimat narasi
function formatArtifactResponse(item) {
  let resp = `**${item.nama_koleksi}** (${item.klasifikasi})`;

  if (item.no_inventarisasi) {
    resp += ` — No. Inventaris: ${item.no_inventarisasi}.`;
  }

  if (item.deskripsi) {
    resp += `\n\n${item.deskripsi}`;
  }

  const specs = [];
  if (item.dimensi?.panjang) specs.push(`Panjang: ${item.dimensi.panjang}`);
  if (item.dimensi?.lebar)   specs.push(`Lebar: ${item.dimensi.lebar}`);
  if (item.dimensi?.tinggi)  specs.push(`Tinggi: ${item.dimensi.tinggi}`);
  if (item.kondisi)          specs.push(`Kondisi: ${item.kondisi}`);
  if (item.tempat_penyimpanan) specs.push(`Lokasi Penyimpanan: ${item.tempat_penyimpanan}`);

  if (specs.length > 0) {
    resp += `\n\n📋 ${specs.join(' | ')}`;
  }

  if (item.keterangan) {
    resp += `\n\n🔍 Keterangan: ${item.keterangan}`;
  }

  return resp;
}

// Helper: deteksi pertanyaan umum tentang museum
function checkMuseumInfo(message) {
  const msg = message.toLowerCase();

  if (msg.includes('jam') || msg.includes('buka') || msg.includes('tutup') || msg.includes('waktu')) {
    return MUSEUM_INFO.jam_buka;
  }
  if (msg.includes('lokasi') || msg.includes('alamat') || msg.includes('dimana') || msg.includes('di mana')) {
    return MUSEUM_INFO.lokasi;
  }
  if (msg.includes('tiket') || msg.includes('harga') || msg.includes('masuk') || msg.includes('bayar')) {
    return MUSEUM_INFO.tiket;
  }
  if (msg.includes('telepon') || msg.includes('kontak') || msg.includes('hubungi') || msg.includes('telp')) {
    return MUSEUM_INFO.telepon;
  }
  if (msg.includes('sejarah museum') || msg.includes('tentang museum') || msg.includes('profil museum')) {
    return MUSEUM_INFO.sejarah;
  }

  return null;
}

// ============================================================
// POST /api/chat
// Body: { "message": "ceritakan tentang golok ciomas" }
// Response: { "reply": "...", "artifacts": [...] }
// ============================================================
router.post('/', (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
  }

  // 1. Cek pertanyaan umum museum
  const museumReply = checkMuseumInfo(message);
  if (museumReply) {
    return res.json({ reply: museumReply, artifacts: [] });
  }

  // 2. Cari di data koleksi menggunakan Fuse.js
  const collections = loadCollections();

  if (collections.length === 0) {
    return res.json({
      reply: 'Maaf, data koleksi museum belum tersedia. Silakan hubungi petugas untuk informasi lebih lanjut.',
      artifacts: [],
    });
  }

  const fuse = new Fuse(collections, {
    keys: [
      { name: 'nama_koleksi', weight: 2 },
      { name: 'deskripsi',    weight: 1 },
      { name: 'klasifikasi',  weight: 1 },
      { name: 'keterangan',   weight: 0.5 },
    ],
    threshold:       0.4,
    includeScore:    true,
    minMatchCharLen: 2,
  });

  const results = fuse.search(message);

  if (results.length === 0) {
    return res.json({
      reply: `Maaf, saya tidak menemukan informasi tentang "${message}" di database koleksi Museum Sri Baduga. Coba tanyakan nama benda koleksi yang lebih spesifik, atau tanya tentang jam buka, lokasi, dan tiket museum.`,
      artifacts: [],
    });
  }

  // Ambil maksimal 3 hasil teratas
  const topResults = results.slice(0, 3).map(r => r.item);

  let reply;
  if (topResults.length === 1) {
    reply = `Berikut informasi tentang koleksi yang kamu tanyakan:\n\n${formatArtifactResponse(topResults[0])}`;
  } else {
    reply = `Saya menemukan ${topResults.length} koleksi yang relevan dengan pertanyaanmu:\n\n`;
    topResults.forEach((item, idx) => {
      reply += `${idx + 1}. **${item.nama_koleksi}** (${item.klasifikasi})\n`;
      if (item.deskripsi) {
        reply += `   ${item.deskripsi.slice(0, 100)}...\n\n`;
      }
    });
    reply += `\nKetik nama yang lebih spesifik untuk informasi lengkap.`;
  }

  res.json({
    reply,
    artifacts: topResults.map(a => ({
      id:              a.id,
      nama_koleksi:    a.nama_koleksi,
      klasifikasi:     a.klasifikasi,
      no_inventarisasi: a.no_inventarisasi,
    })),
  });
});

module.exports = router;
