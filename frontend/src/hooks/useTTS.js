import { useCallback } from 'react';

const TTS_API = 'http://localhost:8000/tts/speak';

// Global audio instance agar audio antar komponen tidak bertabrakan
let globalAudio = null;

/**
 * Custom hook untuk Text-to-Speech menggunakan Microsoft Neural Voice (edge-tts).
 * Memanggil backend /tts/speak dan memainkan audio MP3 yang dihasilkan.
 */
export function useTTS() {
  const speak = useCallback((text) => {
    if (!text || !text.trim()) return;

    // Hentikan audio yang sedang diputar di mana pun
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.src = '';
    }

    try {
      // Gunakan streaming GET secara langsung dengan menempelkan teks sebagai parameter
      const streamUrl = `${TTS_API}?text=${encodeURIComponent(text)}`;
      globalAudio = new Audio(streamUrl);

      // Play audio secara langsung selagi data distream
      globalAudio.play().catch(() => {
        console.warn('[TTS] Autoplay diblokir browser, menunggu interaksi user.');
      });

    } catch (err) {
      console.error('[TTS] Error:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.src = '';
      globalAudio = null;
    }
  }, []);

  return { speak, stop };
}
