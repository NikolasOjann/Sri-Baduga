from fastapi import APIRouter

from app.models.collection import MuseumCollection
from app.services.collection_service import CollectionService

router = APIRouter(
    prefix="/collections",
    tags=["Collections"]
)

service = CollectionService()


@router.get("/")
def get_all():

    return service.get_all()


@router.post("/")
def add_collection(
    collection: MuseumCollection
):

    return service.add(collection)