const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'data', 'collections.json');
let data = [];

try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (error) {
  console.error("Gagal membaca file JSON:", error.message);
  process.exit(1);
}

// Fungsi untuk menerjemahkan teks menggunakan Google Translate API (Gratis)
async function translateText(text, sourceLang = 'id', targetLang = 'en') {
  if (!text) return "";
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  
  try {
    const response = await fetch(url);
    const json = await response.json();
    
    // API ini mengembalikan array, kita perlu menggabungkan teksnya
    let translated = "";
    if (json && json[0]) {
      json[0].forEach(item => {
        if (item[0]) translated += item[0];
      });
    }
    return translated;
  } catch (error) {
    console.error(`Error translating: ${text.substring(0, 20)}...`, error.message);
    return ""; // Kembalikan string kosong jika gagal
  }
}

// Fungsi penunda (delay) untuk mencegah diblokir oleh Google API
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runAutoTranslate() {
  console.log(`Memulai proses terjemahan otomatis untuk ${data.length} artefak...`);
  console.log("Mohon tunggu, ini membutuhkan waktu beberapa menit untuk menghindari limit API (rate limit).\n");

  let translatedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    // Cek apakah deskripsi_en belum ada, kosong, atau kita ingin timpa
    if (item.deskripsi && (!item.deskripsi_en || item.deskripsi_en.trim() === '')) {
      process.stdout.write(`Menerjemahkan ID ${item.id} (${item.nama_koleksi})... `);
      
      const translatedDesc = await translateText(item.deskripsi);
      item.deskripsi_en = translatedDesc;
      
      console.log('Selesai ✅');
      translatedCount++;
      
      // Delay 1 detik antar request agar tidak kena blokir IP oleh Google
      await delay(1000);
      
      // (Opsional) simpan setiap 10 item agar aman jika berhenti di tengah jalan
      if (translatedCount % 10 === 0) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
      }
    }
  }

  // Simpan akhir
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`\n🎉 Selesai! Berhasil menerjemahkan ${translatedCount} deskripsi baru.`);
}

// Jalankan (Pastikan Node.js versi 18+ karena menggunakan fungsi 'fetch' bawaan)
runAutoTranslate();
