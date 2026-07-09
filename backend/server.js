const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve gambar artefak sebagai static files
// Akses: http://localhost:3001/images/{kategori}/{filename}.jpg
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Serve file model 3D (.glb / .gltf) sebagai static files
// Akses: http://localhost:3001/models/{filename}.glb
app.use('/models', express.static(path.join(__dirname, 'public', 'models')));


// ============================================================
// Routes
// ============================================================
app.use('/api/collections', require('./routes/collections'));
app.use('/api/chat',        require('./routes/chat'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log(`\n=== Museum Sri Baduga Backend ===`);
  console.log(`Server berjalan di  : http://localhost:${PORT}`);
  console.log(`\nEndpoints tersedia:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/collections`);
  console.log(`  GET  /api/collections/:id`);
  console.log(`  GET  /api/collections/kategori/:nama`);
  console.log(`  POST /api/chat`);
  console.log(`\nTips: Jalankan "npm run extract" untuk mengekstrak PDF ke JSON`);
  console.log('================================\n');
});
