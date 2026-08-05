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
const mapKlasifikasiToFolder = (klasifikasi) => {
  if (!klasifikasi) return 'Uploads';
  const k = klasifikasi.toLowerCase();
  if (k.includes('arkeo')) return 'arkeo';
  if (k.includes('etno')) return 'etno';
  if (k.includes('geo')) return 'geo';
  if (k.includes('bio')) return 'bio';
  if (k.includes('histo')) return 'histo';
  if (k.includes('numis')) return 'numis';
  if (k.includes('filo')) return 'filo';
  if (k.includes('keramo')) return 'keramo';
  if (k.includes('seni')) return 'senirupa';
  if (k.includes('tekno')) return 'tekno';
  return 'Uploads';
};

async function main() {
  const pdfPath = process.argv[2];
  const artifactId = process.argv[3];

  if (!pdfPath || !artifactId) {
    console.error('Usage: node extract-single-image.js <pdf_path> <artifact_id>');
    process.exit(1);
  }

  const raw = fs.readFileSync(COLLECTIONS_FILE, 'utf-8');
  const collections = JSON.parse(raw);
  
  const itemIndex = collections.findIndex(c => String(c.id) === String(artifactId));
  if (itemIndex === -1) {
    console.error(`[ERROR] Koleksi dengan ID ${artifactId} tidak ditemukan.`);
    process.exit(1);
  }
  
  const item = collections[itemIndex];
  const folderName = mapKlasifikasiToFolder(item.klasifikasi);
  const targetDir = path.join(__dirname, '..', 'public', 'images', folderName);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Hitung nomor urut file berdasarkan isi folder
  let maxSeq = 0;
  const files = fs.readdirSync(targetDir);
  files.forEach(f => {
    const match = f.match(new RegExp(`^${folderName}-(\\d+)\\.(png|jpg|jpeg)$`, 'i'));
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  const finalPngName = `${folderName}-${nextSeq}.png`;
  const finalPngPath = path.join(targetDir, finalPngName);

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
    console.log(`[NODE] Memanggil Python AI Remove BG (Folder: ${folderName}, File: ${finalPngName})...`);
    execSync(`"${PYTHON_CMD}" "${REMBG_SCRIPT}" "${bestFile}" "${finalPngPath}"`, { stdio: 'inherit' });

    // 4. Update collections.json
    if (fs.existsSync(finalPngPath)) {
      const publicUrl = `http://localhost:3001/images/${folderName}/${finalPngName}`;
      
      collections[itemIndex].gambar = publicUrl;
      fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 2), 'utf-8');
      console.log(`[NODE] Sukses update koleksi ID ${artifactId} dengan gambar: ${publicUrl}`);
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
