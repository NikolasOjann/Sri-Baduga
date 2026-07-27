from app.rag.database_manager import get_database


class RetrieverService:

    def __init__(self):

        self.database = get_database()

    def extract_keyword(self, text):
        import re
        if not text: return ""
        # Hapus tanda baca
        text = re.sub(r'[^\w\s]', '', text.lower())
        
        # Daftar kata tanya/stopwords umum yang mengganggu pencarian metadata
        stopwords = [
            "apa", "itu", "ini", "saja", "siapa", "dimana", "di mana", "kapan",
            "mengapa", "kenapa", "bagaimana", "berikan", "tolong", "jelaskan",
            "tentang", "info", "informasi", "kalo", "kalau", "dong", "sih",
            "yang", "dimaksud", "arti", "artinya", "berarti", "adalah", "fungsi"
        ]
        
        words = text.split()
        cleaned_words = [w for w in words if w not in stopwords]
        
        # Jika setelah dihapus habis, kembalikan text asli (safety fallback)
        if not cleaned_words:
            return text.strip()
            
        return " ".join(cleaned_words)

    # =====================================================
    # SEARCH
    # =====================================================

    def search(self, question, k=3):
        # Ekstrak kata kunci inti dari pertanyaan untuk pencarian metadata
        keyword = self.extract_keyword(question)

        # 1 Metadata Search
        docs = self.database.metadata_search(keyword)
        if docs:
            print("Metadata Search :", len(docs))
            return docs

        # 2 Vector Search (Gunakan full question untuk vector, atau fallback ke keyword)
        docs = self.database.vector_search(question, k)
        print("Vector Search :", len(docs))
        return docs