import { useCallback, useState, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || ('http://' + window.location.hostname + ':3001');

/**
 * Custom hook untuk Text-to-Speech menggunakan endpoint backend (edge-tts).
 * Menghasilkan suara yang lebih natural dan jernih dibanding browser TTS.
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  // Mencegah memory leak / audio terus memutar jika komponen unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const speak = useCallback(async (text, lang = 'id') => {
    return new Promise((resolve) => {
      if (!text || !text.trim()) {
        resolve();
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      try {
        const url = `${API_BASE}/api/tts/speak?text=${encodeURIComponent(text)}&lang=${lang}`;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        
        audio.onended = () => {
          setIsSpeaking(false);
          resolve();
        };

        audio.onerror = (e) => {
          console.error("Audio TTS error:", e);
          setIsSpeaking(false);
          resolve(); // Resolve agar tidak stuck
        };

        audio.play().catch(err => {
          console.error("Audio TTS play error:", err);
          setIsSpeaking(false);
          resolve();
        });
      } catch (e) {
        console.error("TTS fetch error:", e);
        setIsSpeaking(false);
        resolve();
      }
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
