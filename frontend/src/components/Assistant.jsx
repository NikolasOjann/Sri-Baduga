import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const API_BASE = 'http://localhost:3001';

const Assistant = () => {
  const [isOpen, setIsOpen]   = useState(false);
  const [isSending, setIsSending] = useState(false);
  const location = useLocation();
  const { t }    = useLanguage();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');

  // Update greeting when language changes or initially
  useEffect(() => {
    setMessages([
      { text: t('assistantGreeting'), sender: "nyai" }
    ]);
  }, [t]);

  // Listen for custom event to open assistant
  useEffect(() => {
    const handleOpenAssistant = () => setIsOpen(true);
    window.addEventListener('open-assistant', handleOpenAssistant);
    return () => window.removeEventListener('open-assistant', handleOpenAssistant);
  }, []);

  // Context-aware messages based on route
  useEffect(() => {
    let contextMsg = "";
    if (location.pathname === '/catalog') {
      contextMsg = t('assistantCatalogContext');
    } else if (location.pathname.startsWith('/interactive')) {
      contextMsg = t('assistantInteractiveContext');
    }

    if (contextMsg) {
      setMessages(prev => {
        // Prevent duplicate context messages
        if (prev.length > 0 && prev[prev.length - 1].text === contextMsg) {
          return prev;
        }
        return [...prev, { text: contextMsg, sender: "nyai" }];
      });
      // Optionally auto-open the assistant to guide the user
      setIsOpen(true);
    }
  }, [location.pathname, t]);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.reply, sender: 'nyai' }]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Maaf, saya sedang tidak dapat merespons. Pastikan server berjalan.',
        sender: 'nyai'
      }]);
    } finally {
      setIsSending(false);
    }
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
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%' }}></div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: '#fff' }}>{t('assistantTitle')}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', color: '#a3a3a3', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
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
                type="submit"
                disabled={isSending || !input.trim()}
                style={{
                  background: isSending ? '#6b7280' : '#3b82f6',
                  color: '#fff', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', flexShrink: 0,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                }}
                onMouseEnter={(e) => { if (!isSending) e.currentTarget.style.background = '#2563eb'; }}
                onMouseLeave={(e) => { if (!isSending) e.currentTarget.style.background = '#3b82f6'; }}
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
          backgroundColor: '#3b82f6',
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 5px 20px rgba(59, 130, 246, 0.5)',
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
