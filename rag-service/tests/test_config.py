import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

sys.path.append(str(BASE_DIR))

from app.core.config import settings

print("="*50)

print(settings.PROJECT_NAME)

print(settings.DATASET)

print(settings.VECTOR_DB)

print(settings.CHUNK_SIZE)

print(settings.EMBEDDING_MODEL)

print(settings.LLM_MODEL)

print("="*50)