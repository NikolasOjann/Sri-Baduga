import asyncio
import io
import logging
import edge_tts

logger = logging.getLogger(__name__)

def get_voice_for_lang(lang: str) -> str:
    """Mengembalikan voice ID Microsoft Neural berdasarkan kode bahasa."""
    if lang == "en":
        return "en-US-JennyNeural" # Suara wanita Bahasa Inggris
    return "id-ID-GadisNeural"      # Default: Suara wanita Bahasa Indonesia

async def _stream_audio_generator(text: str, voice: str):
    """Generator async untuk men-stream chunk audio MP3 secara real-time."""
    try:
        communicate = edge_tts.Communicate(text, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]
    except Exception as e:
        logger.warning(f"[TTS Service] Gagal stream audio Edge TTS: {e}")

def stream_speech(text: str, lang: str = "id"):
    """
    Mengembalikan async generator untuk stream audio MP3.
    """
    text = text.strip()
    if not text:
        return None
    if len(text) > 1000:
        text = text[:1000] + "..."
        
    voice = get_voice_for_lang(lang)
    return _stream_audio_generator(text, voice)

