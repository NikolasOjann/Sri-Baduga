from fastapi import APIRouter

from app.services.index_service import IndexService
from app.rag.pipeline import clear_llm_cache

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

service = IndexService()


@router.post("/reindex")
def rebuild_database():

    # Bersihkan Semantic Cache LLM agar data lama tidak menyangkut
    clear_llm_cache()

    total = service.rebuild()

    return {
        "status": "success",
        "indexed_documents": total
    }