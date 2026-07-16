from app.rag.database_manager import get_database


class RetrieverService:

    def __init__(self):

        self.database = get_database()

    # =====================================================
    # SEARCH
    # =====================================================

    def search(self, keyword, k=3):

        # 1 Metadata Search

        docs = self.database.metadata_search(keyword)

        if docs:

            print("Metadata Search :", len(docs))

            return docs

        # 2 Vector Search

        docs = self.database.vector_search(keyword, k)

        print("Vector Search :", len(docs))

        return docs