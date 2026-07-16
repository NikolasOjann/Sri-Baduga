from app.rag.database_manager import get_database


class RetrieverService:

    def __init__(self):

        self.database = get_database()

    # =====================================================
    # SEARCH
    # =====================================================

    def search(
        self,
        question,
        k=3
    ):

        keyword = self.extract_keyword(question)

        print()
        print("=" * 60)
        print("RETRIEVER")
        print("=" * 60)
        print("Question :", question)
        print("Keyword  :", keyword)

        # =====================================================
        # 1. SEARCH NAME
        # =====================================================

        documents = self.database.search_name(keyword)

        if documents:

            print("Source : NAME")
            print("Found  :", len(documents))

            return self.remove_duplicate(documents)

        # =====================================================
        # 2. SEARCH METADATA
        # =====================================================

        documents = self.database.search_metadata(keyword)

        if documents:

            print("Source : METADATA")
            print("Found  :", len(documents))

            return self.remove_duplicate(documents)

        # =====================================================
        # 3. VECTOR SEARCH
        # =====================================================

        documents = self.database.search_vector(

            question,

            k=k

        )

        print("Source : VECTOR")
        print("Found  :", len(documents))

        return self.remove_duplicate(documents)

    # =====================================================
    # REMOVE DUPLICATE
    # =====================================================

    def remove_duplicate(self, documents):

        result = []

        ids = set()

        for doc in documents:

            if doc is None:
                continue

            doc_id = doc.metadata.get("id")

            chunk = doc.metadata.get("chunk", 0)

            key = (doc_id, chunk)

            if key not in ids:

                ids.add(key)

                result.append(doc)

        return result

    # =====================================================
    # KEYWORD
    # =====================================================

    def extract_keyword(self, question):

        keyword = question.lower()

        ignore = [

            "apa itu",

            "apa",

            "siapa",

            "dimana",

            "di mana",

            "jelaskan",

            "ceritakan",

            "fungsi",

            "asal",

            "berasal",

            "terbuat dari",

            "terbuat",

            "buat",

            "adalah",

            "tentang",

            "informasi",

            "koleksi"

        ]

        for word in ignore:

            keyword = keyword.replace(word, "")

        return keyword.strip()