/**
 * scripts/extract-single-image.js
 * Ekstrak gambar artefak dari satu PDF menggunakan pdfimages (Poppler), 
 * lalu panggil script Python (remove-single-bg.py) untuk hapus background.
 *
 * Usage: node scripts/extract-single-image.js <pdf_path> <artifact_id>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PDFIMAGES_CMD = 'D:\\poppler\\Library\\bin\\pdfimages.exe';
const PYTHON_CMD = 'C:\\laragon\\bin\\python\\python-3.10\\python.exe';
const REMBG_SCRIPT = path.join(__dirname, 'remove-single-bg.py');
const COLLECTIONS_FILE = path.join(__dirname, '..', 'data', 'collections.json');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'Uploads');
const PUBLIC_BASE_URL = 'http://localhost:3001/images/Uploads';

async function main() {
  const pdfPath = process.argv[2];
  const artifactId = process.argv[3];

  if (!pdfPath || !artifactId) {
    console.error('Usage: node extract-single-image.js <pdf_path> <artifact_id>');
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const safePrefix = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '_' + Date.now();
  const tmpDir = path.join(__dirname, '..', 'data', '.tmp_images', safePrefix);

  try {
    // 1. Ekstrak gambar dengan Poppler ke folder tmp
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPrefix = path.join(tmpDir, 'img');
    console.log(`[NODE] Mengekstrak gambar PDF: ${pdfPath}`);
    
    // -png format output, -j fallback for jpeg
    execSync(`"${PDFIMAGES_CMD}" -png -j -p "${pdfPath}" "${outputPrefix}"`, { stdio: 'pipe' });
    
    const extractedFiles = fs.readdirSync(tmpDir).filter(f => f.startsWith('img') && /\.(jpg|png|ppm|pbm)$/i.test(f));
    
    if (extractedFiles.length === 0) {
      console.warn(`[WARN] Tidak ditemukan gambar dalam PDF.`);
      process.exit(0);
    }

    // 2. Pilih gambar terbesar (biasanya foto artefak utama)
    let bestFile = null;
    let maxSize = 0;
    for (const f of extractedFiles) {
      const fPath = path.join(tmpDir, f);
      const stat = fs.statSync(fPath);
      if (stat.size > maxSize) {
        maxSize = stat.size;
        bestFile = fPath;
      }
    }

    if (!bestFile) {
      process.exit(0);
    }

    // 3. Panggil skrip Python untuk hapus background
    const finalPngName = `${safePrefix}.png`;
    const finalPngPath = path.join(IMAGES_DIR, finalPngName);
    
    console.log(`[NODE] Memanggil Python AI Remove BG...`);
    execSync(`"${PYTHON_CMD}" "${REMBG_SCRIPT}" "${bestFile}" "${finalPngPath}"`, { stdio: 'inherit' });

    // 4. Update collections.json
    if (fs.existsSync(finalPngPath)) {
      const publicUrl = `${PUBLIC_BASE_URL}/${finalPngName}`;
      
      const raw = fs.readFileSync(COLLECTIONS_FILE, 'utf-8');
      const collections = JSON.parse(raw);
      
      const itemIndex = collections.findIndex(c => String(c.id) === String(artifactId));
      if (itemIndex !== -1) {
        collections[itemIndex].gambar = publicUrl;
        fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 2), 'utf-8');
        console.log(`[NODE] Sukses update koleksi ID ${artifactId} dengan gambar: ${publicUrl}`);
      } else {
        console.warn(`[WARN] Koleksi dengan ID ${artifactId} tidak ditemukan di database.`);
      }
    }
    
  } catch (err) {
    console.error(`[ERROR] Gagal proses gambar: ${err.message}`);
  } finally {
    // Bersihkan file temporary
    if (fs.existsSync(tmpDir)) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  }
}

main();
