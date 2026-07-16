from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.core.config import settings
from app.rag.embedding import MuseumEmbedding


class MuseumEmbeddingAdapter(Embeddings):

    def __init__(self):
        self.embedding = MuseumEmbedding()

    def embed_documents(self, texts):
        return self.embedding.embed_documents(texts)

    def embed_query(self, text):
        return self.embedding.embed_query(text)


class MuseumVectorStore:

    def __init__(self):

        self.embedding = MuseumEmbeddingAdapter()

        self.db = Chroma(
            persist_directory=str(settings.VECTOR_DB),
            embedding_function=self.embedding
        )

    # =====================================================
    # ADD DOCUMENT
    # =====================================================

    def add_documents(self, documents):

        self.db.add_documents(documents)

    # =====================================================
    # GET ALL DOCUMENT
    # =====================================================

    def all_documents(self):

        return self.db.get()

    # =====================================================
    # SEARCH BY NAME
    # =====================================================

    def search_name(self, keyword):

        keyword = keyword.lower().strip()

        data = self.db.get()

        documents = []

        total = len(data["documents"])

        for i in range(total):

            metadata = data["metadatas"][i]

            name = str(
                metadata.get(
                    "name",
                    ""
                )
            ).lower()

            if keyword in name:

                documents.append(

                    Document(

                        page_content=data["documents"][i],

                        metadata=metadata

                    )

                )

        return documents

    # =====================================================
    # SEARCH METADATA
    # =====================================================

    def search_metadata(self, keyword):

        keyword = keyword.lower().strip()

        data = self.db.get()

        documents = []

        fields = [

            "category",

            "location",

            "condition"

        ]

        total = len(data["documents"])

        for i in range(total):

            metadata = data["metadatas"][i]

            found = False

            for field in fields:

                value = str(

                    metadata.get(

                        field,

                        ""

                    )

                ).lower()

                if keyword in value:

                    found = True
                    break

            if found:

                documents.append(

                    Document(

                        page_content=data["documents"][i],

                        metadata=metadata

                    )

                )

        return documents

    # =====================================================
    # VECTOR SEARCH
    # =====================================================

    def mmr_search(self, query, k=10):

        return self.db.max_marginal_relevance_search(

            query=query,

            k=k,

            fetch_k=20

        )

    # =====================================================
    # SIMILARITY
    # =====================================================

    def similarity_search(self, query, k=5):

        return self.db.similarity_search(

            query=query,

            k=k

        )

    # =====================================================
    # RESET
    # =====================================================

    def reset(self):

        try:

            data = self.db.get()

            ids = data.get("ids", [])

            if ids:

                self.db.delete(ids=ids)

        except Exception as e:

            print("Reset Error :", e)