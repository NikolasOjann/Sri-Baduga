from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from app.services.tts_service import stream_speech

router = APIRouter()


@router.get("/tts/speak")
async def speak(text: str = "", lang: str = "id"):
    """
    Endpoint TTS: menerima teks dan bahasa dari query parameter, men-stream audio MP3 langsung.
    """
    if not text.strip():
        return {"error": "Teks kosong"}

    generator = stream_speech(text, lang)
    if not generator:
        return {"error": "Gagal generate stream"}

    return StreamingResponse(
        generator,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=speech.mp3",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked"
        }
    )
