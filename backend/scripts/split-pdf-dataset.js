/**
 * scripts/split-pdf-dataset.js
 * Memecah file PDF besar (etnografika.pdf, filologika.pdf, senirupa.pdf)
 * menjadi file-file PDF per artefak di dalam subfolder:
 * backend/data/<Klasifikasi>/<Nama_Koleksi>/<file>.pdf
 *
 * Jalankan: node scripts/split-pdf-dataset.js
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const DATA_DIR         = path.join(__dirname, '..', 'data');
const DATASET_DIR      = path.join(DATA_DIR, 'dataset');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');

const FILES_TO_SPLIT = [
  { file: 'etnografika.pdf', kategori: 'Etnografika' },
  { file: 'filologika.pdf',  kategori: 'Filologika'  },
  { file: 'senirupa.pdf',    kategori: 'Seni Rupa'   },
];

function sanitizeName(str) {
  if (!str) return 'Umum';
  return str
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCategory(catName, defaultCat) {
  const c = (catName || defaultCat || 'Etnografika').trim();
  const lower = c.toLowerCase();
  if (lower.includes('etno')) return 'Etnografika';
  if (lower.includes('filo')) return 'Filologika';
  if (lower.includes('seni')) return 'Seni Rupa';
  if (lower.includes('geolog')) return 'Geologika';
  if (lower.includes('biolog')) return 'Biologika';
  if (lower.includes('arkeolog')) return 'Arkeologika';
  if (lower.includes('histor')) return 'Historika';
  if (lower.includes('numismat')) return 'Numismatika';
  if (lower.includes('keramol')) return 'Keramologika';
  if (lower.includes('teknol')) return 'Teknologika';
  return c;
}

async function main() {
  console.log('==================================================');
  console.log('  PEMISAHAN PDF ARTEFAK KE SUBFOLDER KLASIFIKASI  ');
  console.log('==================================================\n');

  if (!fs.existsSync(COLLECTIONS_FILE)) {
    console.error('[ERROR] collections.json tidak ditemukan. Harap jalankan node scripts/extract-pdf.js terlebih dahulu.');
    process.exit(1);
  }

  const collections = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf-8'));
  let totalSplit = 0;

  for (const { file, kategori } of FILES_TO_SPLIT) {
    let pdfPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(pdfPath)) {
      pdfPath = path.join(DATASET_DIR, file);
    }
    if (!fs.existsSync(pdfPath)) {
      console.log(`[SKIP] File tidak ditemukan: ${file}`);
      continue;
    }

    console.log(`[PDF] Memproses & memecah: ${file} (${kategori})...`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const originalPdf = await PDFDocument.load(pdfBytes);
    const pageCount = originalPdf.getPageCount();

    // Filter koleksi berdasarkan kategori
    const categoryArtifacts = collections.filter(c => {
      const norm = normalizeCategory(c.klasifikasi, kategori);
      return norm === normalizeCategory(kategori);
    });

    for (let i = 0; i < pageCount; i++) {
      const artifact = categoryArtifacts[i] || {
        nama_koleksi: `Artefak_Halaman_${i + 1}`,
        klasifikasi: kategori,
        no_inventarisasi: `Hal_${i + 1}`,
      };

      const normCategory   = normalizeCategory(artifact.klasifikasi, kategori);
      const klasifikasiDir = sanitizeName(normCategory);
      const kelompokDir    = sanitizeName(artifact.nama_koleksi || `Kelompok_${i + 1}`);
      const targetFolder   = path.join(DATA_DIR, klasifikasiDir, kelompokDir);

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const singlePdf = await PDFDocument.create();
      const [copiedPage] = await singlePdf.copyPages(originalPdf, [i]);
      singlePdf.addPage(copiedPage);

      const invPart  = sanitizeName(artifact.no_inventarisasi || String(i + 1)).replace(/\s+/g, '_');
      const namePart = sanitizeName(artifact.nama_koleksi).replace(/\s+/g, '_');
      const fileName = `${namePart}_${invPart}.pdf`;
      const targetPath = path.join(targetFolder, fileName);

      const singlePdfBytes = await singlePdf.save();
      fs.writeFileSync(targetPath, singlePdfBytes);
      totalSplit++;
    }

    console.log(`  [OK] Berhasil memecah ${pageCount} halaman dari ${file} ke folder: data/${normalizeCategory(kategori)}/`);

    // Pindahkan file asli ke folder dataset
    if (!fs.existsSync(DATASET_DIR)) {
      fs.mkdirSync(DATASET_DIR, { recursive: true });
    }
    const destPath = path.join(DATASET_DIR, file);
    if (pdfPath !== destPath) {
      fs.renameSync(pdfPath, destPath);
      console.log(`  [DATASET] File asli dipindahkan ke: data/dataset/${file}\n`);
    } else {
      console.log(`  [DATASET] File asli ada di: data/dataset/${file}\n`);
    }
  }

  console.log(`==================================================`);
  console.log(`[SELESAI] Total ${totalSplit} file PDF artefak berhasil dipisahkan!`);
  console.log(`Selanjutnya kamu bisa menjalankan:`);
  console.log(`  node scripts/extract-pdf.js`);
  console.log(`  node scripts/extract-images.js`);
  console.log(`==================================================`);
}

main().catch(console.error);
