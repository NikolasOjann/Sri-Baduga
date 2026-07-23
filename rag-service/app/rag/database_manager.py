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
        self.category_index = defaultdict(list)
        # Cache hasil pencarian agar query berulang tidak re-compute
        self._metadata_cache: dict = {}
        self._vector_cache: dict = {}
        self.load_database()

    # =====================================================
    # LOAD DATABASE
    # =====================================================

    def load_database(self):
        loader = MuseumLoader(settings.DATASET)
        self.documents = loader.load()
        self.name_index.clear()
        self.category_index.clear()
        self._metadata_cache.clear()
        self._vector_cache.clear()

        for document in self.documents:
            name = document.metadata.get("name", "").lower().strip()
            category = document.metadata.get("category", "").lower().strip()
            
            if name:
                self.name_index[name].append(document)
            if category:
                self.category_index[category].append(document)

    # =====================================================
    # VECTOR SEARCH (dengan cache)
    # =====================================================

    def vector_search(self, query, k=10):
        cache_key = f"{query.lower().strip()}|{k}"
        if cache_key in self._vector_cache:
            print("⚡ [Cache HIT] vector_search:", query)
            return self._vector_cache[cache_key]
        result = self.vectorstore.mmr_search(query=query, k=k)
        # Batasi cache agar tidak tumbuh tak terbatas
        if len(self._vector_cache) > 128:
            self._vector_cache.pop(next(iter(self._vector_cache)))
        self._vector_cache[cache_key] = result
        return result

    # =====================================================
    # METADATA SEARCH (dengan cache + fuzzy)
    # =====================================================

    def metadata_search(self, keyword):
        import difflib
        keyword = keyword.lower().strip()

        # Kembalikan dari cache jika ada
        if keyword in self._metadata_cache:
            print("⚡ [Cache HIT] metadata_search:", keyword)
            return self._metadata_cache[keyword]

        result = []
        
        # 1. Fuzzy match Category
        all_cats = list(self.category_index.keys())
        cat_matches = difflib.get_close_matches(keyword, all_cats, n=3, cutoff=0.7)
        for cat in all_cats:
            if keyword in cat and cat not in cat_matches:
                cat_matches.append(cat)
        for cat in cat_matches:
            result.extend(self.category_index[cat])
            
        # 2. Fuzzy match Name
        all_names = list(self.name_index.keys())
        name_matches = difflib.get_close_matches(keyword, all_names, n=5, cutoff=0.7)
        for name in all_names:
            if keyword in name and name not in name_matches:
                name_matches.append(name)
        for name in name_matches:
            result.extend(self.name_index[name])

        # Simpan ke cache (maksimal 256 entry)
        if len(self._metadata_cache) > 256:
            self._metadata_cache.pop(next(iter(self._metadata_cache)))
        self._metadata_cache[keyword] = result
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