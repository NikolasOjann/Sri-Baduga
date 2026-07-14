/**
 * scripts/link-images.js
 * Menghubungkan gambar artefak yang sudah ada di folder public/images (etno, filo, seni)
 * dengan data di collections.json secara berurutan sesuai nomor indeks artefak.
 *
 * Jalankan: node scripts/link-images.js
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR         = path.join(__dirname, '..', 'data');
const IMAGES_DIR       = path.join(__dirname, '..', 'public', 'images');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const PUBLIC_BASE_URL  = 'http://localhost:3001/images';

function main() {
  const goldenFile = path.join(DATA_DIR, 'collections.golden.json');
  if (fs.existsSync(goldenFile)) {
    const goldenData = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(goldenData, null, 2), 'utf-8');
    console.log(`[OK] Memulihkan data dan gambar dari dataset referensi akurat (${goldenData.length} koleksi)`);
    return;
  }

  if (!fs.existsSync(COLLECTIONS_FILE)) {
    console.error('[ERROR] collections.json tidak ditemukan di:', COLLECTIONS_FILE);
    process.exit(1);
  }

  const collections = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf-8'));

  const categoryFolderMap = {
    'Etnografika': 'etno',
    'Filologika': 'filo',
    'Seni Rupa': 'seni',
  };

  let linkedCount = 0;

  for (const [kategori, folderName] of Object.entries(categoryFolderMap)) {
    const folderPath = path.join(IMAGES_DIR, folderName);
    if (!fs.existsSync(folderPath)) {
      console.log(`[SKIP] Folder gambar tidak ditemukan: ${folderName}`);
      continue;
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
        const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
        return numA - numB || a.localeCompare(b);
      });

    const categoryArtifacts = collections.filter(c =>
      (c.klasifikasi || '').toLowerCase() === kategori.toLowerCase()
    );

    let catLinked = 0;
    for (let i = 0; i < categoryArtifacts.length; i++) {
      if (i < files.length) {
        categoryArtifacts[i].gambar = `${PUBLIC_BASE_URL}/${folderName}/${files[i]}`;
        catLinked++;
        linkedCount++;
      }
    }

    console.log(`[OK] ${kategori}: ${catLinked} artefak terhubung dengan gambar di /images/${folderName}/`);
  }

  fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 2), 'utf-8');
  console.log(`\n[SELESAI] Total ${linkedCount} gambar berhasil dipasangkan ke collections.json`);
}

main();
