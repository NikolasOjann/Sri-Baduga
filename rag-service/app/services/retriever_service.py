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
        import re
        import difflib
        if not question: return ""
        
        q_lower = question.lower()
        # Hapus tanda baca
        q_clean = re.sub(r'[^\w\s]', '', q_lower)
        
        # 1. STRATEGI POSITIF: Cari nama koleksi/kategori langsung di dalam pertanyaan
        all_names = list(self.database.name_index.keys())
        all_cats = list(self.database.category_index.keys())
        all_targets = all_names + all_cats
        
        # Urutkan dari yang paling panjang (agar 'arca nandi' terdeteksi sblm 'arca')
        all_targets.sort(key=len, reverse=True)
        
        for target in all_targets:
            # Jika target ada di dalam string pertanyaan
            if target and target in q_clean:
                return target
                
        # 2. FILTER STOPWORDS SEBELUM FUZZY
        words = q_clean.split()
        stopwords = [
            "apa", "itu", "ini", "saja", "siapa", "dimana", "di", "mana", "kapan",
            "mengapa", "kenapa", "bagaimana", "berikan", "tolong", "jelaskan",
            "tentang", "info", "informasi", "kalo", "kalau", "dong", "sih",
            "yang", "dimaksud", "arti", "artinya", "berarti", "adalah", "fungsi",
            "coba", "ceritakan", "sejarah", "asal", "usul", "berasal", "terbuat", 
            "dari", "buat", "koleksi", "jelasin", "mun", "naon", "kumaha", "kunaon",
            "membuat", "pembuat", "dibikin", "bikin", "membuatnya"
        ]
        meaningful_words = [w for w in words if w not in stopwords]
        
        # 3. STRATEGI FUZZY: Cari jika ada salah ketik sedikit (typo)
        for word in meaningful_words:
            if len(word) >= 4:
                matches = difflib.get_close_matches(word, all_targets, n=1, cutoff=0.75)
                if matches:
                    return matches[0]
        
        # 4. STRATEGI NEGATIF (Fallback)
        if not meaningful_words:
            return question.strip()
            
        return " ".join(meaningful_words)