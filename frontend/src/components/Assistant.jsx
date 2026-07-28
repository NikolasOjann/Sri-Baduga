import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader, Volume2, VolumeX, Mic } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useTTS } from '../hooks/useTTS';

const API_BASE = 'http://localhost:3001';

const Assistant = () => {
  const [isOpen, setIsOpen]   = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const location = useLocation();
  const { t, language } = useLanguage();
  const messagesEndRef = useRef(null);
  const lastSpokenIndexRef = useRef(-1); // Mencegah TTS terpicu dua kali untuk pesan yang sama
  const recognitionRef = useRef(null);
  const { speak, stop } = useTTS();

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');

  // Update greeting when language changes or initially
  useEffect(() => {
    const greeting = t('assistantGreeting');
    setMessages(prev => {
      // Jika chat masih kosong atau isinya cuma sapaan awal, maka perbarui bahasanya
      if (prev.length === 0 || (prev.length === 1 && prev[0].sender === "nyai")) {
        return [{ text: greeting, sender: "nyai" }];
      }
      // Jika sudah ada riwayat obrolan panjang, biarkan riwayatnya utuh (tidak reset)
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Bacakan sapaan chatbot setiap kali user membuka chatbot, matikan saat ditutup
  useEffect(() => {
    if (isOpen) {
      if (!isMuted) {
        speak(t('assistantGreeting'), language);
      }
    } else {
      // Hentikan suara jika chatbot ditutup
      stop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, language]);

  // Listen for custom event to open assistant
  useEffect(() => {
    const handleOpenAssistant = () => setIsOpen(true);
    window.addEventListener('open-assistant', handleOpenAssistant);
    return () => window.removeEventListener('open-assistant', handleOpenAssistant);
  }, []);

  // Context-aware messages based on route (Audio-only, tidak masuk riwayat chat)
  useEffect(() => {
    // Hentikan suara sebelumnya setiap kali pindah halaman
    stop();

    let contextMsg = "";
    if (location.pathname === '/') {
      contextMsg = language === 'id' 
        ? "Sampurasun. Selamat datang di Sri Baduga, jelajahi dengan leluasa dan nikmati perjalanan yang nyaman dan berkesan." 
        : "Welcome to Sri Baduga. Explore freely and enjoy a comfortable and memorable journey.";
    } else if (location.pathname === '/catalog') {
      contextMsg = t('assistantCatalogContext');
    } else if (location.pathname.startsWith('/collection/')) {
      // Dapatkan ID kategori dari URL (misal: /collection/1 atau /collection/Etnografika)
      const parts = location.pathname.split('/');
      let categoryId = parts[2];
      
      if (categoryId && categoryId !== 'undefined' && categoryId !== 'null') {
        categoryId = decodeURIComponent(categoryId).toLowerCase();
        
        // Mapping jika navigasi kembali menggunakan nama kategori, bukan ID angka
        const KATEGORI_NAME_TO_ID = {
          'geologika': '1', 'biologika': '2', 'etnografika': '3', 
          'arkeologika': '4', 'historika': '5', 'numismatika': '6', 
          'filologika': '7', 'keramologika': '8', 'seni rupa': '9', 'teknologika': '10'
        };
        
        if (KATEGORI_NAME_TO_ID[categoryId]) {
          categoryId = KATEGORI_NAME_TO_ID[categoryId];
        }

        const key = `assistantCollectionContext_${categoryId}`;
        const translated = t(key);
        // Cegah pembacaan key mentah (yang ada underscore-nya) jika translation tidak ditemukan
        if (translated !== key) {
          contextMsg = translated;
        }
      }
    }
    // rute '/interactive' sengaja dihapus dari sini agar tidak tabrakan dengan penjelasan barang di InteractiveView.jsx

    // Langsung bacakan tanpa menambahkan ke balon teks chat
    if (contextMsg && !isMuted) {
      speak(contextMsg, language);
    }
  }, [location.pathname, t, isMuted, speak, language]);

  // Auto-speak setiap pesan baru dari nyai (AI)
  useEffect(() => {
    if (messages.length > 0 && !isMuted) {
      const lastIndex = messages.length - 1;
      const lastMsg = messages[lastIndex];
      
      // Hanya speak pesan dari nyai (dan pastikan pesan pada index ini belum pernah dibacakan)
      if (lastMsg.sender === "nyai" && lastSpokenIndexRef.current !== lastIndex) {
        lastSpokenIndexRef.current = lastIndex;
        speak(lastMsg.text, language);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isMuted, speak, language]);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessageToAPI = async (text) => {
    if (!text.trim()) return;

    // Hentikan audio yang sedang berjalan saat user kirim pesan baru
    stop();

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        text: data.reply, 
        sender: 'nyai',
        source: data.source,
        artifacts: data.artifacts || []
      }]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Maaf, saya sedang tidak dapat merespons. Pastikan server berjalan.',
        sender: 'nyai'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    
    const userMsg = input.trim();
    setInput('');
    sendMessageToAPI(userMsg);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Maaf, browser Anda tidak mendukung fitur suara (Gunakan Chrome/Edge terbaru).');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'en' ? 'en-US' : 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessageToAPI(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '340px',
              height: '450px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Header */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%' }}></div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: '#fff' }}>{t('assistantTitle')}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Tombol Mute/Unmute */}
                <button
                  onClick={() => {
                    if (!isMuted) stop();
                    setIsMuted(prev => !prev);
                  }}
                  title={isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
                  style={{ background: 'none', color: isMuted ? '#6b7280' : '#4ade80', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', color: '#a3a3a3', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#C2B280' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.sender === 'nyai' ? '4px' : '16px',
                    maxWidth: '85%',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    whiteSpace: 'pre-wrap',
                  }}>
                  {msg.text}

                  {msg.source && (
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                      {msg.source === 'ollama_rag' && <span style={{ color: '#4ade80', fontWeight: '500' }}>⚡ Dijawab oleh AI Ollama & RAG</span>}
                      {msg.source === 'local_fuse' && <span style={{ color: '#fbbf24', fontWeight: '500' }}>🔍 Dijawab oleh Pencarian Lokal (Fallback)</span>}
                      {msg.source === 'museum_faq' && <span style={{ color: '#60a5fa', fontWeight: '500' }}>ℹ️ Informasi Umum Museum</span>}
                    </div>
                  )}

                  {msg.sender === 'nyai' && (
                    <button
                      onClick={() => speak(msg.text)}
                      title="Ulangi Audio"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#4ade80',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        marginTop: '10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      <Volume2 size={14} /> Putar Ulang
                    </button>
                  )}

                  {msg.artifacts && msg.artifacts.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.artifacts.map((art, aIdx) => (
                        <div key={aIdx} style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ overflow: 'hidden' }}>
                            <strong style={{ color: '#fff', display: 'block' }}>{art.nama_koleksi}</strong>
                            {art.klasifikasi && <span style={{ color: '#a3a3a3', fontSize: '0.75rem' }}>{art.klasifikasi}</span>}
                          </div>
                          {art.no_inventarisasi && <span style={{ background: 'rgba(194,178,128,0.2)', color: '#C2B280', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', flexShrink: 0, marginLeft: '8px' }}>{art.no_inventarisasi}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading indicator saat menunggu balasan */}
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: '4px',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#a3a3a3', animation: 'bounce 1.2s infinite 0s' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#a3a3a3', animation: 'bounce 1.2s infinite 0.2s' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#a3a3a3', animation: 'bounce 1.2s infinite 0.4s' }} />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', gap: '10px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('askAssistant')}
                disabled={isSending}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  outline: 'none',
                  padding: '10px 15px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  opacity: isSending ? 0.5 : 1,
                }}
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isSending}
                title={isListening ? "Berhenti Suara" : "Gunakan Suara"}
                style={{
                  background: isListening ? '#ef4444' : 'rgba(255,255,255,0.05)',
                  color: isListening ? '#fff' : '#a3a3a3',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '40px', height: '40px', flexShrink: 0,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.6)' : 'none'
                }}
              >
                {isListening ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '16px' }}>
                    <span className="voice-bar" style={{ animationDelay: '0s' }} />
                    <span className="voice-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="voice-bar" style={{ animationDelay: '0.4s' }} />
                    <span className="voice-bar" style={{ animationDelay: '0.1s' }} />
                  </div>
                ) : (
                  <Mic size={16} />
                )}
              </button>
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                style={{
                  background: isSending ? '#6b7280' : '#C2B280',
                  color: '#fff', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', flexShrink: 0,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                }}
                onMouseEnter={(e) => { if (!isSending) e.currentTarget.style.background = '#AD9C69'; }}
                onMouseLeave={(e) => { if (!isSending) e.currentTarget.style.background = '#C2B280'; }}
              >
                {isSending
                  ? <Loader size={16} className="spin" />
                  : <Send size={16} style={{ marginLeft: '2px' }} />
                }
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          backgroundColor: '#C2B280',
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 5px 20px rgba(194, 178, 128, 0.5)',
          position: 'relative',
          cursor: 'pointer',
          zIndex: 10
        }}
        className="assistant-sprite"
      >
        <MessageCircle color="#fff" size={30} />
        {/* Unread indicator could go here */}
        {!isOpen && messages.length > 1 && (
          <div style={{ position: 'absolute', top: 0, right: 0, width: '15px', height: '15px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #1a1a1a' }}></div>
        )}
      </motion.button>
    </div>
  );
};

export default Assistant;
