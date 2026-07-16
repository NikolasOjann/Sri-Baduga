from collections import defaultdict

from app.core.config import settings
from app.rag.loader import MuseumLoader
from app.rag.splitter import MuseumSplitter
from app.rag.vectorstore import MuseumVectorStore


class DatabaseManager:

    def __init__(self):

        self.vectorstore = MuseumVectorStore()

        self.documents = []

        self.name_index = defaultdict(list)

        self.load_database()

    # =====================================================
    # LOAD DATABASE
    # =====================================================

    def load_database(self):

        loader = MuseumLoader(settings.DATASET)

        self.documents = loader.load()

        self.name_index.clear()

        for document in self.documents:

            name = document.metadata.get("name", "").lower().strip()

            self.name_index[name].append(document)

    # =====================================================
    # VECTOR SEARCH
    # =====================================================

    def vector_search(self, query, k=10):

        return self.vectorstore.mmr_search(query=query, k=k)

    # =====================================================
    # METADATA SEARCH
    # =====================================================

    def metadata_search(self, keyword):

        keyword = keyword.lower().strip()

        result = []

        for name, docs in self.name_index.items():

            if keyword in name:

                result.extend(docs)

        return result

    # =====================================================
    # COMPATIBILITY WRAPPERS
    #
    # Older code expects methods named `search_name`, `search_metadata`,
    # and `search_vector`. Provide thin wrappers to keep backward
    # compatibility without changing other callers.
    # =====================================================

    def search_name(self, keyword):

        return self.metadata_search(keyword)

    def search_metadata(self, keyword):

        return self.metadata_search(keyword)

    def search_vector(self, query, k=10):

        return self.vector_search(query, k)

    # =====================================================
    # REBUILD
    # =====================================================

    def rebuild(self):

        self.vectorstore.reset()

        loader = MuseumLoader(settings.DATASET)

        documents = loader.load()

        splitter = MuseumSplitter()

        chunks = splitter.split(documents)

        self.vectorstore.add_documents(chunks)

        self.documents = documents

        self.name_index.clear()

        for document in documents:

            name = document.metadata.get("name", "").lower().strip()

            self.name_index[name].append(document)

        return len(chunks)


_database = DatabaseManager()


def get_database():
    return _database