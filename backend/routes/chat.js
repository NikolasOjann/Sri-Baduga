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
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return data.filter(item => item && item.gambar && typeof item.gambar === 'string' && item.gambar.trim() !== '' && item.gambar !== 'null');
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
// Body: { "message": "ceritakan tentang golok ciomas", "session_id": "optional_session_id" }
// Response: { "reply": "...", "artifacts": [...], "source": "ollama_rag" | "local_fuse" }
// ============================================================
router.post('/', async (req, res) => {
  const { message, session_id } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
  }

  // 1. Cek pertanyaan umum museum (jam buka, tiket, alamat, dsb)
  const museumReply = checkMuseumInfo(message);
  if (museumReply) {
    return res.json({ reply: museumReply, artifacts: [], source: 'museum_faq' });
  }

  // 2. Coba hubungi Python RAG & Ollama Service (Submodule llm-museum di port 8000)
  try {
    const ragResponse = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: message,
        session_id: session_id || 'default_session',
      }),
      signal: AbortSignal.timeout(600000), // Timeout 10 menit (600.000 ms) agar Ollama di CPU tidak terputus
    });

    if (ragResponse.ok) {
      const ragData = await ragResponse.json();
      
      // DEBUG: Lihat apa yang dikirim Python RAG
      console.log('📦 [RAG Sources dari Python]:', JSON.stringify(ragData.sources, null, 2));

      // Pemetaan sources dari Python RAG agar cocok dengan format artifacts di Frontend
      let artifacts = [];
      const collections = loadCollections();
      if (ragData.sources && Array.isArray(ragData.sources)) {
        const rawArtifacts = ragData.sources.map(s => {
          // Prioritas 1: cocokkan berdasarkan nomor inventarisasi (paling unik & konsisten)
          let match = s.inventory
            ? collections.find(c => c.no_inventarisasi === s.inventory)
            : null;

          // Prioritas 2: cocokkan berdasarkan nama EXACT (case-insensitive)
          if (!match && s.name) {
            match = collections.find(c =>
              c.nama_koleksi && c.nama_koleksi.toLowerCase() === s.name.toLowerCase()
            );
          }

          return match ? {
            id: match.id,
            nama_koleksi: match.nama_koleksi,
            klasifikasi: match.klasifikasi,
            no_inventarisasi: match.no_inventarisasi,
            gambar: match.gambar,
          } : null;
        }).filter(Boolean);

        // Filter hanya tampilkan koleksi yang memiliki foto (sesuai aturan tampilan web)
        const validArtifacts = rawArtifacts.filter(a => a.gambar && typeof a.gambar === 'string' && a.gambar.trim() !== '' && a.gambar !== 'null');

        // Cek apakah ini mode "pilihan" (nama berbeda) atau "detail" (nama sama, inventory beda)
        const uniqueSourceNames = new Set(ragData.sources.map(s => s.name));
        const isChoosingMode = uniqueSourceNames.size > 1;

        if (isChoosingMode) {
          // Mode clarification: deduplikasi by nama agar hanya tampil 1 kartu per nama
          const seenNames = new Set();
          artifacts = validArtifacts.filter(a => {
            const key = a.nama_koleksi?.toLowerCase();
            if (!key || seenNames.has(key)) return false;
            seenNames.add(key);
            return true;
          });
          console.log('🗂️  [Mode: Pilihan] Deduplikasi aktif');
        } else {
          // Mode post-selection: tampilkan semua item individual (beda no. inventaris)
          artifacts = validArtifacts;
          console.log('📋 [Mode: Detail] Semua item ditampilkan');
        }

        console.log('✅ [Artifacts dikirim ke Frontend]:', artifacts.map(a => `${a.nama_koleksi} (${a.no_inventarisasi})`));
      }

      return res.json({
        reply: ragData.answer,
        artifacts: artifacts,
        session_id: ragData.session_id || 'default_session',
        source: 'ollama_rag',
      });
      // Jika RAG merespons status non-ok, kembalikan pesan error.
      console.log(`⚠️ [RAG Service] Python RAG merespons status non-ok: ${ragResponse.status}`);
      return res.status(500).json({
        reply: "Mohon maaf, server AI saat ini sedang mengalami gangguan. Silakan coba lagi nanti.",
        artifacts: [],
        source: 'error'
      });
    }
  } catch (err) {
    console.log(`⚠️ [RAG Service] Gagal terhubung ke Python RAG (${err.message}).`);
    return res.status(500).json({
      reply: "Mohon maaf, server AI (LLM+RAG) saat ini sedang offline. Pastikan Python server sudah berjalan.",
      artifacts: [],
      source: 'error'
    });
  }
});

module.exports = router;
