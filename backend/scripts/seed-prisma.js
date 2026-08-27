const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, '..', 'data', 'collections.json');

async function main() {
  console.log('Memulai migrasi data dari collections.json ke PostgreSQL...');
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('File collections.json tidak ditemukan!');
    process.exit(1);
  }

  // Hapus semua data yang ada sebelumnya agar tidak terjadi duplikasi
  console.log('Menghapus data lama di database...');
  await prisma.collection.deleteMany({});

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const collections = JSON.parse(raw);
  console.log(`Ditemukan ${collections.length} data untuk dimigrasikan.`);

  for (const item of collections) {
    // Normalisasi is_public agar berbentuk boolean
    let is_public = true;
    if (item.is_public === false || item.is_public === 'false') {
      is_public = false;
    }

    try {
      await prisma.collection.create({
        data: {
          no_registrasi: item.no_registrasi || '',
          no_inventarisasi: item.no_inventarisasi || '',
          nama_koleksi: item.nama_koleksi || '',
          klasifikasi: item.klasifikasi || '',
          sub_klasifikasi: item.sub_klasifikasi || '',
          tanggal_registrasi: item.tanggal_registrasi || '',
          no_registrasi_nasional: item.no_registrasi_nasional || '',
          tanggal_inventarisasi: item.tanggal_inventarisasi || '',
          status_cb: item.status_cb || '',
          tanggal_perolehan: item.tanggal_perolehan || '',
          deskripsi: item.deskripsi || '',
          tempat_pembuatan: item.tempat_pembuatan || '',
          cara_pembuatan: item.cara_pembuatan || '',
          tempat_perolehan: item.tempat_perolehan || '',
          cara_perolehan: item.cara_perolehan || '',
          tahun_masuk: item.tahun_masuk || '',
          dimensi: item.dimensi || {},
          tempat_penyimpanan: item.tempat_penyimpanan || '',
          kondisi: item.kondisi || '',
          tanggal_pengamatan: item.tanggal_pengamatan || '',
          nama_petugas: item.nama_petugas || '',
          acuan: item.acuan || '',
          keterangan: item.keterangan || '',
          gambar: item.gambar || null,
          model_3d: item.model_3d || null,
          dokumentasi: item.dokumentasi || [],
          pemilik_koleksi: item.pemilik_koleksi || '',
          jenis_pengadaan: item.jenis_pengadaan || '',
          lokasi_provinsi: item.lokasi_provinsi || '',
          lokasi_kabupaten: item.lokasi_kabupaten || '',
          latitude: item.latitude || '',
          longitude: item.longitude || '',
          estimasi_harga: item.estimasi_harga || '',
          tim_pengkaji: item.tim_pengkaji || [],
          sejarah: item.sejarah || '',
          is_public: is_public,
          source_pdf: item.source_pdf || '',
          tanggal_input: item.tanggal_input || ''
        }
      });
      console.log(`✅ Berhasil insert: ${item.nama_koleksi}`);
    } catch (err) {
      console.error(`❌ Gagal insert: ${item.nama_koleksi}. Error: ${err.message}`);
    }
  }

  console.log('✅ Migrasi selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
