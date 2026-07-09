/**
 * extract-pdf.js
 * Script untuk mengekstrak data artefak dari PDF museum ke JSON.
 * Jalankan sekali: node scripts/extract-pdf.js
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// ============================================================
// KONFIGURASI: Daftarkan file PDF di sini
// Taruh file PDF di folder: backend/data/
// ============================================================
const PDF_FILES = [
  { file: 'etnografika.pdf', kategori: 'Etnografika' },
  { file: 'filologika.pdf',  kategori: 'Filologika'  },
  { file: 'senirupa.pdf',    kategori: 'Seni Rupa'   },
];

const DATA_DIR    = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'collections.json');

// ============================================================
// PARSER: Ekstrak satu artefak dari blok teks
// ============================================================
function parseArtifactBlock(text, kategoriDefault) {
  const artifact = {
    no_registrasi:    '',
    no_inventarisasi: '',
    nama_koleksi:     '',
    klasifikasi:      kategoriDefault,
    deskripsi:        '',
    tempat_pembuatan: '',
    tempat_perolehan: '',
    cara_perolehan:   '',
    tahun_masuk:      '',
    dimensi: {
      panjang:  '',
      lebar:    '',
      tinggi:   '',
      tebal:    '',
      diameter: '',
      berat:    '',
    },
    tempat_penyimpanan: '',
    kondisi:            '',
    tanggal_pengamatan: '',
    nama_petugas:       '',
    acuan:              '',
    keterangan:         '',
    gambar:             null,
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Helper: ambil nilai setelah karakter ':'
  const extractAfterColon = (line) => {
    const idx = line.indexOf(':');
    return idx !== -1 ? line.slice(idx + 1).trim() : '';
  };

  // Helper: cek apakah line mengandung keyword field
  const matchField = (line, keyword) =>
    line.toLowerCase().startsWith(keyword.toLowerCase());

  let inUraian = false;
  let uraianLines = [];
  let inKeterangan = false;
  let keteranganLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Hentikan mode uraian jika ketemu field berikutnya
    if (inUraian) {
      if (
        matchField(line, 'Tempat Pembuatan') ||
        matchField(line, 'Tempat Perolehan') ||
        matchField(line, 'Cara Perolehan') ||
        matchField(line, 'Tanggal') ||
        matchField(line, 'Panjang') ||
        matchField(line, 'No Registrasi') ||
        matchField(line, 'Nama Koleksi') ||
        matchField(line, 'Kondisi') ||
        matchField(line, 'Keterangan')
      ) {
        inUraian = false;
        artifact.deskripsi = uraianLines.join(' ').trim();
      } else {
        uraianLines.push(line);
        continue;
      }
    }

    if (inKeterangan) {
      keteranganLines.push(line);
      continue;
    }

    // === Parsing field-by-field ===
    if (matchField(line, 'No Registrasi')) {
      artifact.no_registrasi = extractAfterColon(line);
    } else if (matchField(line, 'No Inventarisasi')) {
      artifact.no_inventarisasi = extractAfterColon(line);
    } else if (matchField(line, 'Nama Koleksi')) {
      artifact.nama_koleksi = extractAfterColon(line);
    } else if (matchField(line, 'Klasifikasi')) {
      const val = extractAfterColon(line);
      if (val) artifact.klasifikasi = val;
    } else if (matchField(line, 'Uraian Singkat')) {
      inUraian = true;
      uraianLines = [];
      const inline = extractAfterColon(line);
      if (inline) uraianLines.push(inline);
    } else if (matchField(line, 'Tempat Pembuatan')) {
      artifact.tempat_pembuatan = extractAfterColon(line);
    } else if (matchField(line, 'Tempat Perolehan')) {
      artifact.tempat_perolehan = extractAfterColon(line);
    } else if (matchField(line, 'Cara Perolehan')) {
      artifact.cara_perolehan = extractAfterColon(line);
    } else if (matchField(line, 'Tanggal/Tahun Masuk')) {
      artifact.tahun_masuk = extractAfterColon(line);
    } else if (matchField(line, 'Panjang')) {
      artifact.dimensi.panjang = extractAfterColon(line);
    } else if (matchField(line, 'Lebar')) {
      artifact.dimensi.lebar = extractAfterColon(line);
    } else if (matchField(line, 'Tinggi')) {
      artifact.dimensi.tinggi = extractAfterColon(line);
    } else if (matchField(line, 'Tebal')) {
      artifact.dimensi.tebal = extractAfterColon(line);
    } else if (matchField(line, 'Diameter')) {
      artifact.dimensi.diameter = extractAfterColon(line);
    } else if (matchField(line, 'Berat')) {
      artifact.dimensi.berat = extractAfterColon(line);
    } else if (matchField(line, 'Tempat Penyimpanan')) {
      artifact.tempat_penyimpanan = extractAfterColon(line);
    } else if (lower.includes('kondisi koleksi')) {
      artifact.kondisi = extractAfterColon(line);
    } else if (matchField(line, 'Tanggal Pengamatan')) {
      artifact.tanggal_pengamatan = extractAfterColon(line);
    } else if (matchField(line, 'Nama Petugas')) {
      artifact.nama_petugas = extractAfterColon(line);
    } else if (matchField(line, 'Acuan')) {
      artifact.acuan = extractAfterColon(line);
    } else if (matchField(line, 'Keterangan Lainnya')) {
      inKeterangan = true;
      keteranganLines = [];
      const inline = extractAfterColon(line);
      if (inline) keteranganLines.push(inline);
    }
  }

  // Tutup state jika teks habis
  if (inUraian) {
    artifact.deskripsi = uraianLines.join(' ').trim();
  }
  if (inKeterangan) {
    artifact.keterangan = keteranganLines.join(' ').trim();
  }

  return artifact;
}

// ============================================================
// SPLITTER: Pisahkan teks PDF menjadi blok per artefak
// Tiap artefak diawali dengan "No Registrasi"
// ============================================================
function splitIntoArtifacts(fullText) {
  const parts = fullText.split(/(?=No\s+Registrasi\s*:)/i);
  return parts.filter(p => p.trim().length > 10);
}

// ============================================================
// MAIN: Proses semua PDF
// ============================================================
async function main() {
  // Pastikan folder data ada
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Folder dibuat: ${DATA_DIR}`);
  }

  let allArtifacts = [];
  let globalId = 1;

  for (const { file, kategori } of PDF_FILES) {
    const pdfPath = path.join(DATA_DIR, file);

    if (!fs.existsSync(pdfPath)) {
      console.warn(`[SKIP] File tidak ditemukan: ${pdfPath}`);
      continue;
    }

    console.log(`\n[PDF] Memproses: ${file} (${kategori})`);

    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData    = await pdfParse(dataBuffer);
      const rawText    = pdfData.text;

      const blocks    = splitIntoArtifacts(rawText);
      const artifacts = blocks.map(block => {
        const parsed = parseArtifactBlock(block, kategori);
        parsed.id = globalId++;
        return parsed;
      }).filter(a => a.nama_koleksi);

      console.log(`[OK] Ditemukan ${artifacts.length} artefak`);
      allArtifacts = allArtifacts.concat(artifacts);

    } catch (err) {
      console.error(`[ERROR] Gagal memproses ${file}:`, err.message);
    }
  }

  // Simpan ke JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allArtifacts, null, 2), 'utf-8');

  console.log(`\n[DONE] Total ${allArtifacts.length} artefak disimpan ke:`);
  console.log(`       ${OUTPUT_FILE}`);

  if (allArtifacts.length > 0) {
    const preview = allArtifacts[0];
    console.log('\n[PREVIEW] Artefak pertama:');
    console.log(`  Nama      : ${preview.nama_koleksi}`);
    console.log(`  Kategori  : ${preview.klasifikasi}`);
    console.log(`  Deskripsi : ${preview.deskripsi.slice(0, 80)}...`);
  }
}

main().catch(console.error);
