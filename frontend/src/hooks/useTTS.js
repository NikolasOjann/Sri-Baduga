import { useCallback, useState, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || ('http://' + window.location.hostname + ':3001');

/**
 * Custom hook untuk Text-to-Speech menggunakan endpoint backend (edge-tts).
 * Menghasilkan suara yang lebih natural dan jernih dibanding browser TTS.
 */
// Variabel global agar suara tidak pernah bertabrakan antar komponen
let globalAudio = null;
let globalSetIsSpeaking = null;

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const stopGlobal = useCallback(() => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.src = "";
      globalAudio = null;
    }
    if (globalSetIsSpeaking) {
      globalSetIsSpeaking(false);
      globalSetIsSpeaking = null;
    }
  }, []);

  // Mencegah memory leak / audio terus memutar jika komponen unmount
  useEffect(() => {
    return () => {
      if (globalAudio === audioRef.current) {
        stopGlobal();
      }
    };
  }, [stopGlobal]);

  const speak = useCallback(async (text, lang = 'id') => {
    return new Promise((resolve) => {
      if (!text || !text.trim()) {
        resolve();
        return;
      }

      // Hentikan suara apapun yang sedang berjalan di seluruh aplikasi
      stopGlobal();

      try {
        const url = `${API_BASE}/api/tts/speak?text=${encodeURIComponent(text)}&lang=${lang}`;
        const audio = new Audio(url);
        audioRef.current = audio;
        
        // Jadikan audio ini sebagai audio global yang aktif
        globalAudio = audio;
        globalSetIsSpeaking = setIsSpeaking;

        audio.onplay = () => setIsSpeaking(true);
        
        audio.onended = () => {
          setIsSpeaking(false);
          if (globalAudio === audio) globalAudio = null;
          resolve();
        };

        audio.onerror = (e) => {
          console.error("Audio TTS error:", e);
          setIsSpeaking(false);
          if (globalAudio === audio) globalAudio = null;
          resolve(); // Resolve agar tidak stuck
        };

        audio.play().catch(err => {
          console.error("Audio TTS play error:", err);
          setIsSpeaking(false);
          if (globalAudio === audio) globalAudio = null;
          resolve();
        });
      } catch (e) {
        console.error("TTS fetch error:", e);
        setIsSpeaking(false);
        resolve();
      }
    });
  }, [stopGlobal]);

  const stop = useCallback(() => {
    if (globalAudio === audioRef.current) {
      stopGlobal();
    } else {
      setIsSpeaking(false);
    }
  }, [stopGlobal]);

  return { speak, stop, isSpeaking };
}
