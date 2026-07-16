from fastapi import APIRouter

from app.services.index_service import IndexService

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

service = IndexService()


@router.post("/reindex")
def rebuild_database():

    total = service.rebuild()

    return {
        "status": "success",
        "indexed_documents": total
    }