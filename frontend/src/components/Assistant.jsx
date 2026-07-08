import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const Assistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Update greeting when language changes or initially
  useEffect(() => {
    setMessages([
      { text: t('assistantGreeting'), sender: "nyai" }
    ]);
  }, [t]);

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

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, sender: "user" }]);
    setInput("");

    // Dummy RAG/LLM response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: t('assistantResponse'), sender: "nyai" }]);
    }, 1000);
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
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                  {msg.text}
                </motion.div>
              ))}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('askAssistant')}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  outline: 'none',
                  padding: '10px 15px',
                  borderRadius: '20px',
                  marginRight: '10px',
                  fontSize: '0.95rem'
                }}
              />
              <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'} onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}>
                <Send size={18} style={{ marginLeft: '2px' }} />
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
