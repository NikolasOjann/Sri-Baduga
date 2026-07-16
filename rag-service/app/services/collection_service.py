import json
from pathlib import Path

from app.core.config import settings
from app.models.collection import MuseumCollection


class CollectionService:

    def __init__(self):

        self.file = settings.DATASET

    def _load(self):

        if not self.file.exists():
            return []

        with open(self.file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save(self, data):

        with open(self.file, "w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                indent=4,
                ensure_ascii=False
            )

    def get_all(self):

        return self._load()

    def add(self, collection: MuseumCollection):

        data = self._load()

        data.append(collection.model_dump())

        self._save(data)

        return collection