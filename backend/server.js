const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Dummy RAG / LLM endpoint
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  // Simulasi proses RAG dan inferensi LLM
  setTimeout(() => {
    let reply = "Menarik! Saat ini saya masih dalam tahap purwarupa, namun nantinya saya dapat menceritakan sejarah lengkap koleksi tersebut berdasarkan database museum.";
    
    if (message.toLowerCase().includes('kujang')) {
      reply = "Kujang adalah senjata tradisional khas Jawa Barat. Di Museum Sri Baduga, kami memiliki koleksi kujang dari era Pajajaran yang dipamerkan di lantai dua.";
    } else if (message.toLowerCase().includes('jam')) {
      reply = "Museum Sri Baduga buka setiap hari Selasa hingga Minggu, dari pukul 08:00 hingga 16:00 WIB. Hari Senin dan hari libur nasional kami tutup.";
    }

    res.json({ reply });
  }, 1000); // delay simulasi 1 detik
});

app.listen(PORT, () => {
  console.log(`Dummy Backend Server berjalan di http://localhost:${PORT}`);
  console.log(`Endpoint RAG Chatbot: POST http://localhost:${PORT}/api/chat`);
});
