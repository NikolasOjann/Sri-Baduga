/**
 * scripts/extract-images.js
 * Ekstrak gambar artefak dari PDF menggunakan pdfimages (Poppler).
 *
 * Prasyarat: Poppler sudah terinstall dan `pdfimages` ada di PATH.
 * Jalankan: node scripts/extract-images.js
 *
 * Cara kerja:
 *  1. Jalankan `pdfimages -j -p` untuk tiap PDF → hasilkan file JPG per halaman
 *  2. Tiap halaman = 1 artefak, ambil gambar terbesar (= foto artefak)
 *  3. Simpan ke backend/public/images/{kategori}/
 *  4. Update collections.json → field 'gambar' diisi URL gambar
 */

const { execSync }  = require('child_process');
const fs            = require('fs');
const path          = require('path');

// ============================================================
// KONFIGURASI
// ============================================================
const PDF_FILES = [
  { file: 'etnografika.pdf', kategori: 'Etnografika', prefix: 'etno' },
  { file: 'filologika.pdf',  kategori: 'Filologika',  prefix: 'filo' },
  { file: 'senirupa.pdf',    kategori: 'Seni Rupa',   prefix: 'seni' },
];

// Jika pdfimages TIDAK ada di PATH, isi path lengkap ke pdfimages.exe di sini.
// Contoh: 'D:\\poppler\\Library\\bin\\pdfimages.exe'
// Jika sudah ada di PATH, biarkan sebagai string 'pdfimages' saja.
const PDFIMAGES_CMD = 'D:\\poppler\\Library\\bin\\pdfimages.exe';

const DATA_DIR       = path.join(__dirname, '..', 'data');
const IMAGES_DIR     = path.join(__dirname, '..', 'public', 'images');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');

// URL publik yang akan dipakai frontend (sesuaikan jika port berubah)
const PUBLIC_BASE_URL = 'http://localhost:3001/images';

// ============================================================
// HELPER: Cek apakah pdfimages bisa dijalankan
// ============================================================
function checkPoppler() {
  try {
    // pdfimages tanpa argumen keluar dengan exit code 1 tapi itu normal
    // Kita cukup cek apakah file exe ada dan bisa diakses
    const fs2 = require('fs');
    if (PDFIMAGES_CMD !== 'pdfimages') {
      return fs2.existsSync(PDFIMAGES_CMD);
    }
    // Jika pakai PATH, coba jalankan
    execSync(`"${PDFIMAGES_CMD}" -h`, { stdio: 'pipe' });
    return true;
  } catch {
    // exit code non-zero tapi masih bisa jalan = OK
    return true;
  }
}

// ============================================================
// HELPER: Ekstrak nomor halaman dari nama file pdfimages
// Format: {prefix}-{3-digit-page}-{3-digit-index}.jpg
// Contoh: etno-001-000.jpg → halaman 1
// ============================================================
function getPageNumber(filename) {
  const match = filename.match(/-(\d{3})-\d{3}\.(jpg|png|ppm|pbm)$/i);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================
// HELPER: Kelompokkan file berdasarkan nomor halaman
// ============================================================
function groupByPage(files, tmpDir) {
  const pages = {};
  for (const file of files) {
    const page = getPageNumber(file);
    if (page === null) continue;
    if (!pages[page]) pages[page] = [];

    const fullPath = path.join(tmpDir, file);
    const stat     = fs.statSync(fullPath);
    pages[page].push({ file, fullPath, size: stat.size });
  }
  return pages;
}

// ============================================================
// MAIN
// ============================================================
// ============================================================
// HELPER: Cari semua file PDF secara rekursif
// ============================================================
function getAllPdfFiles(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item.toLowerCase() === 'dataset' || item.toLowerCase() === '_backup_raw_pdfs') {
        continue;
      }
      results = results.concat(getAllPdfFiles(fullPath, baseDir));
    } else if (item.toLowerCase().endsWith('.pdf')) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ fullPath, relPath, fileName: item });
    }
  }
  return results;
}

// ============================================================
// HELPER: Pasangkan gambar yang sudah ada di public/images ke koleksi
// ============================================================
function linkExistingImages(collections) {
  const categoryFolderMap = {
    'Etnografika': 'etno',
    'Filologika': 'filo',
    'Seni Rupa': 'seni',
  };

  let linkedCount = 0;

  for (const [kategori, folderName] of Object.entries(categoryFolderMap)) {
    const folderPath = path.join(IMAGES_DIR, folderName);
    if (!fs.existsSync(folderPath)) continue;

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

    for (let i = 0; i < categoryArtifacts.length; i++) {
      if (i < files.length && !categoryArtifacts[i].gambar) {
        categoryArtifacts[i].gambar = `${PUBLIC_BASE_URL}/${folderName}/${files[i]}`;
        linkedCount++;
      }
    }
  }

  return linkedCount;
}

async function main() {
  // 1. Cek Poppler
  const hasPoppler = checkPoppler();
  if (!hasPoppler) {
    console.warn('[WARN] pdfimages tidak dapat dijalankan, melanjutkan dengan mencocokkan gambar yang sudah ada di public/images...');
  } else {
    console.log('[OK] Poppler ditemukan\n');
  }

  // 2. Pastikan folder output ada
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // 3. Load collections.json yang sudah ada
  if (!fs.existsSync(COLLECTIONS_FILE)) {
    console.error('[ERROR] collections.json tidak ditemukan!');
    console.error('        Jalankan dulu: node scripts/extract-pdf.js');
    process.exit(1);
  }
  const collections = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf-8'));
  console.log(`[INFO] Memuat ${collections.length} artefak dari collections.json\n`);

  const pdfFiles = getAllPdfFiles(DATA_DIR);
  console.log(`[INFO] Ditemukan ${pdfFiles.length} file PDF untuk diekstrak gambarnya.\n`);

  // 4. Proses tiap PDF
  for (const { fullPath: pdfPath, relPath, fileName } of pdfFiles) {
    // Prefix aman untuk folder dan nama file
    const safePrefix = relPath.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const outputDir = path.join(IMAGES_DIR, safePrefix);

    // Kosongkan folder output sebelum ekstraksi agar bersih
    if (fs.existsSync(outputDir)) {
      for (const oldFile of fs.readdirSync(outputDir)) {
        try { fs.unlinkSync(path.join(outputDir, oldFile)); } catch {}
      }
    } else {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPrefix = path.join(outputDir, 'img');
    console.log(`[PDF] Mengekstrak gambar: ${relPath}`);

    try {
      execSync(`"${PDFIMAGES_CMD}" -png -j -p "${pdfPath}" "${outputPrefix}"`, {
        stdio: 'pipe',
      });

      const allFiles = fs.readdirSync(outputDir).filter(f =>
        f.startsWith('img') && /\.(jpg|png|ppm|pbm)$/i.test(f)
      );

      if (allFiles.length === 0) {
        console.warn(`  [SKIP] Tidak ada gambar yang diekstrak dari ${relPath}`);
        continue;
      }

      const pages = groupByPage(allFiles, outputDir);
      console.log(`  [OK] ${allFiles.length} file gambar dari ${Object.keys(pages).length} halaman`);

      let matchCount = 0;
      for (const [pageStr, imgs] of Object.entries(pages)) {
        const pageNum = parseInt(pageStr, 10);

        imgs.sort((a, b) => b.size - a.size);
        const best = imgs[0];

        const ext = path.extname(best.file).toLowerCase();
        const cleanName = `${safePrefix}-${String(pageNum).padStart(3, '0')}${ext}`;
        const destPath  = path.join(outputDir, cleanName);

        fs.copyFileSync(best.fullPath, destPath);

        const publicUrl = `${PUBLIC_BASE_URL}/${safePrefix}/${cleanName}`;

        // Match ke artefak berdasarkan source_pdf + urutan di dalam PDF tersebut
        const targetArtifact = collections.find(c =>
          c.source_pdf === relPath && c.pdf_index === pageNum
        );

        if (targetArtifact) {
          targetArtifact.gambar = publicUrl;
          matchCount++;
        } else if (pageNum === 1) {
          // Fallback jika hanya ada 1 artefak di file PDF ini
          const singleArtifact = collections.find(c => c.source_pdf === relPath);
          if (singleArtifact && !singleArtifact.gambar) {
            singleArtifact.gambar = publicUrl;
            matchCount++;
          }
        }
      }

      console.log(`  [MATCH] ${matchCount} artefak berhasil dipasangkan dengan gambar`);

      // Hapus file raw
      for (const f of allFiles) {
        const rawPath = path.join(outputDir, f);
        try { fs.unlinkSync(rawPath); } catch {}
      }

    } catch (err) {
      console.error(`  [ERROR] Gagal mengekstrak ${relPath}:`, err.message);
    }
  }

  // Link gambar yang ada di folder public/images (etno, filo, seni)
  const linkedExisting = linkExistingImages(collections);
  if (linkedExisting > 0) {
    console.log(`[LINK] ${linkedExisting} artefak berhasil dihubungkan ke gambar di public/images`);
  }

  // 5. Simpan collections.json yang sudah diperbarui
  fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 2), 'utf-8');

  const withImage = collections.filter(c => c.gambar).length;
  console.log(`\n[DONE] ${withImage} dari ${collections.length} artefak memiliki gambar`);
  console.log(`       Gambar disimpan di: ${IMAGES_DIR}`);
  console.log(`       collections.json diperbarui!`);
}

main().catch(err => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
