from pathlib import Path
from dotenv import load_dotenv
import os

# ===============================
# BASE DIRECTORY
# ===============================

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SESSION_PATH = BASE_DIR / "app" / "sessions"
MEMORY_DB = BASE_DIR / "memory.db"
# backend/
load_dotenv(BASE_DIR / ".env")


class Settings:

    PROJECT_NAME = os.getenv(
        "PROJECT_NAME",
        "Museum AI Assistant"
    )

    EMBEDDING_MODEL = os.getenv(
        "EMBEDDING_MODEL",
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )

    VECTOR_DB = BASE_DIR / os.getenv(
        "VECTOR_DB",
        "chroma_db/vector_db"
    )

    DATASET = BASE_DIR.parent / "backend" / "data" / "collections.json"

    CHUNK_SIZE = int(
        os.getenv(
            "CHUNK_SIZE",
            "500"
        )
    )

    CHUNK_OVERLAP = int(
        os.getenv(
            "CHUNK_OVERLAP",
            "100"
        )
    )

    LLM_MODEL = os.getenv(
        "LLM_MODEL",
        "qwen2.5:1.5b"
    )

    OLLAMA_URL = os.getenv(
        "OLLAMA_URL",
        "http://localhost:11434"
    )


settings = Settings()