import asyncio
import io
import edge_tts


# Suara wanita Bahasa Indonesia (Microsoft Neural)
VOICE = "id-ID-GadisNeural"


async def _stream_audio_generator(text: str):
    """Generator async untuk men-stream chunk audio MP3 secara real-time."""
    communicate = edge_tts.Communicate(text, VOICE)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            yield chunk["data"]

def stream_speech(text: str):
    """
    Mengembalikan async generator untuk stream audio MP3.
    """
    text = text.strip()
    if not text:
        return None
    if len(text) > 1000:
        text = text[:1000] + "..."
    return _stream_audio_generator(text)
