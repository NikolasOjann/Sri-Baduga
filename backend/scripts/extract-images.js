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
async function main() {
  // 1. Cek Poppler
  if (!checkPoppler()) {
    console.error('[ERROR] pdfimages tidak dapat dijalankan!');
    console.error('        Cek path di variabel PDFIMAGES_CMD di baris atas script ini.');
    console.error(`        Path saat ini: ${PDFIMAGES_CMD}`);
    console.error('        Download: https://github.com/oschwartz10612/poppler-windows/releases/');
    process.exit(1);
  }
  console.log('[OK] Poppler ditemukan\n');

  // 2. Pastikan folder output ada
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // 3. Load collections.json yang sudah ada
  if (!fs.existsSync(COLLECTIONS_FILE)) {
    console.error('[ERROR] collections.json tidak ditemukan!');
    console.error('        Jalankan dulu: npm run extract');
    process.exit(1);
  }
  const collections = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf-8'));
  console.log(`[INFO] Memuat ${collections.length} artefak dari collections.json\n`);

  // 4. Proses tiap PDF
  for (const { file, kategori, prefix } of PDF_FILES) {
    const pdfPath   = path.join(DATA_DIR, file);
    const outputDir = path.join(IMAGES_DIR, prefix);

    if (!fs.existsSync(pdfPath)) {
      console.warn(`[SKIP] File tidak ditemukan: ${pdfPath}`);
      continue;
    }

    // Kosongkan folder output per kategori sebelum ekstraksi agar bersih dari file lama/corrupt
    if (fs.existsSync(outputDir)) {
      for (const oldFile of fs.readdirSync(outputDir)) {
        try { fs.unlinkSync(path.join(outputDir, oldFile)); } catch {}
      }
    } else {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPrefix = path.join(outputDir, prefix);
    console.log(`[PDF] Mengekstrak gambar: ${file}`);

    try {
      // Jalankan pdfimages
      // -png = ubah format non-jpeg (seperti ppm/pbm) menjadi png agar support di browser
      // -j   = simpan gambar jpeg asli sebagai .jpg
      // -p   = sertakan nomor halaman di nama file
      execSync(`"${PDFIMAGES_CMD}" -png -j -p "${pdfPath}" "${outputPrefix}"`, {
        stdio: 'pipe',
      });

      // Baca semua file yang dihasilkan
      const allFiles = fs.readdirSync(outputDir).filter(f =>
        f.startsWith(prefix) && /\.(jpg|png|ppm|pbm)$/i.test(f)
      );

      if (allFiles.length === 0) {
        console.warn(`  [SKIP] Tidak ada gambar yang diekstrak dari ${file}`);
        continue;
      }

      // Kelompokkan per halaman
      const pages = groupByPage(allFiles, outputDir);
      console.log(`  [OK] ${allFiles.length} file gambar dari ${Object.keys(pages).length} halaman`);

      // Untuk tiap halaman: ambil gambar TERBESAR (= foto artefak, bukan logo kecil)
      let matchCount = 0;
      for (const [pageStr, imgs] of Object.entries(pages)) {
        const pageNum = parseInt(pageStr, 10);

        // Urutkan by ukuran terbesar → ambil yang pertama
        imgs.sort((a, b) => b.size - a.size);
        const best = imgs[0];

        // Ambil ekstensi asli (bisa .jpg atau .png)
        const ext = path.extname(best.file).toLowerCase();
        // Nama file bersih: {prefix}-{page}{ext}
        const cleanName = `${prefix}-${String(pageNum).padStart(3, '0')}${ext}`;
        const destPath  = path.join(outputDir, cleanName);

        // Rename/copy ke nama bersih
        fs.copyFileSync(best.fullPath, destPath);

        // URL publik untuk frontend
        const publicUrl = `${PUBLIC_BASE_URL}/${prefix}/${cleanName}`;

        // Match ke artefak di collections.json berdasarkan kategori + urutan halaman
        // Halaman 1 = artefak pertama di kategori ini, dst.
        const categoryItems = collections.filter(c =>
          c.klasifikasi.toLowerCase() === kategori.toLowerCase()
        );
        const artifactIndex = pageNum - 1; // halaman 1-indexed → array 0-indexed

        if (categoryItems[artifactIndex]) {
          const artifact = categoryItems[artifactIndex];
          // Update di array utama
          const globalIdx = collections.findIndex(c => c.id === artifact.id);
          if (globalIdx !== -1) {
            collections[globalIdx].gambar = publicUrl;
            matchCount++;
          }
        }
      }

      console.log(`  [MATCH] ${matchCount} artefak berhasil dipasangkan dengan gambar`);

      // Hapus file raw pdfimages (simpan hanya yang sudah diberi nama bersih)
      for (const f of allFiles) {
        const rawPath  = path.join(outputDir, f);
        // Hapus file raw jika bukan format bersih kita
        if (!f.match(new RegExp(`^${prefix}-\\d{3}\\.(jpg|png)$`))) {
          try { fs.unlinkSync(rawPath); } catch {}
        }
      }

    } catch (err) {
      console.error(`  [ERROR] Gagal mengekstrak ${file}:`, err.message);
    }
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
