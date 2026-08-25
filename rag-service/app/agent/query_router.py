import re
import difflib

class QueryRouter:
    """
    QueryRouter takes the bloated hardcoded logic from pipeline.py 
    and organizes it into clean, deterministic classification methods.
    """
    
    def __init__(self, retriever=None):
        self.retriever = retriever
        
        self.greetings = {"halo", "hallo", "haloo", "halloo", "helo", "hai", "hay", "alow", "allow", "hello", "hei", "hi", "pagi", "siang", "sore", "malam", "selamat", "punten", "sampurasun"}
        self.test_words = {"tes", "test", "testing", "coba", "nyoba", "ping", "cek"}
        self.follow_up_keywords = [
            "terbuat dari", "dari apa", "bahan", "material",
            "fungsi", "kegunaan", "tujuan", "digunakan untuk",
            "asal", "ditemukan", "di peroleh", "dapat dari", "penemu", "pembuat", "penemunya", "pembuatnya",
            "dimana", "di mana", "lokasi", "tempat",
            "siapa", "oleh siapa",
            "kapan", "tahun", "zaman", "era", "masa",
            "berapa", "ukuran", "dimensi", "panjang", "lebar", "tinggi", "berat",
            "apa kegunaan", "apa tujuan",
            "jenis", "klasifikasi", "kategori", "macam", "golongan",
            "apa itu", "maksudnya", "artinya",
            "bagaimana", "cara", "kondisi", "keadaan",
            "mengapa", "kenapa", "alasan",
            "sejarah", "cerita", "detail", "info", "penjelasan"
        ]
        self.general_keywords = [
            "jam", "buka", "tutup", "tiket", "htm", "lokasi", "alamat", "sejarah", 
            "halo", "hai", "hey", "hi", "terima kasih", "makasih", "ada apa", 
            "apa saja", "siapa", "daftar", "harga", "biaya", "masuk", "parkir", 
            "fasilitas", "toilet", "mushola", "panduan", "rute", "denah", "jadwal",
            "selamat pagi", "selamat siang", "selamat sore", "selamat malam"
        ]
        self.collection_list_keywords = [
            "klasifikasi", "jenis koleksi", "jenis-jenis", "ada apa saja",
            "apa saja koleksi", "koleksi apa saja", "koleksi ada apa",
            "ada apa di museum", "isi museum", "apa yang ada", "benda apa saja",
            "tampilkan koleksi", "daftar koleksi", "kategori koleksi", "tipe koleksi",
            "semua koleksi", "ada koleksi apa", "tampilkan semua", "kategori apa",
            "apa saja jenisnya", "jenis benda", "koleksi benda", "macam macam", "macam-macam",
            "jenis jenis", "terdapat apa", "ada item apa", "terdapat item", "berisi apa", "isinya apa",
            "item apa saja", "benda apa yang ada", "koleksi apa yang ada",
            "apa yang terdapat", "apa yang tersimpan", "ada benda apa",
            "ada apa", "apa aja", "ada apa aja", "isinya", "isi nya", "itemnya",
            "item nya", "koleksinya", "koleksi nya"
        ]
        self.cat_definition_patterns = [
            r"apa itu (.+)", r"apa yang dimaksud (.+)", r"jelaskan (.+)",
            r"(.+) itu apa", r"pengertian (.+)", r"definisi (.+)",
            r"maksud dari (.+)", r"arti dari (.+)", r"(.+) berarti", r"(.+) artinya"
        ]

    def route(self, question: str) -> dict:
        q_lower = (question or "").strip().lower()
        q_words = re.sub(r'[^\w\s]', '', q_lower).split()
        word_count = len(q_words)
        
        # 1. Greeting
        is_greeting = word_count <= 3 and any(w in self.greetings for w in q_words)
        is_test_only = word_count > 0 and all(w in self.test_words for w in q_words)
        if is_greeting or is_test_only:
            return {"intent": "greeting"}
            
        # 2. Collection List
        if any(kw in q_lower for kw in self.collection_list_keywords):
            return {"intent": "collection_list"}
            
        # 3. Category Definition
        from app.tools.museum_collection_tool import CATEGORY_INFO
        all_cat_keys = list(CATEGORY_INFO.keys())
        for pat in self.cat_definition_patterns:
            m = re.search(pat, q_lower)
            if m:
                kw = m.group(1).strip()
                cat_matches = difflib.get_close_matches(kw, all_cat_keys, n=1, cutoff=0.6)
                if not cat_matches:
                    for k in all_cat_keys:
                        if kw in k or k in kw:
                            cat_matches = [k]
                            break
                if cat_matches:
                    return {"intent": "category_definition"}
        
        # 4. Exact Item Bypass (Fastest Search)
        if self.retriever:
            extracted_item = self.retriever.extract_keyword(q_lower)
            from app.rag.database_manager import get_database
            db_inst = get_database()
            db_targets = list(db_inst.name_index.keys()) + list(db_inst.category_index.keys())
            if extracted_item in db_targets:
                return {"intent": "exact_search", "keyword": extracted_item}
        
        # 5. Fast Path (Short queries)
        if word_count > 0 and word_count <= 4 and not any(k in q_lower for k in self.general_keywords):
            return {"intent": "fast_search"}
            
        # 6. Fallback to Planner
        return {"intent": "planner"}
        
    def is_follow_up(self, question: str) -> bool:
        q_lower = question.lower()
        
        # Cek persis (Exact match)
        for kw in self.follow_up_keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', q_lower):
                return True
                
        # Cek Fuzzy Logic (Toleransi Typo)
        import difflib
        q_words = re.sub(r'[^\w\s]', '', q_lower).split()
        
        # Pecah keyword yang multi-kata menjadi kata tunggal untuk pencocokan fuzzy
        single_word_keywords = set()
        for kw in self.follow_up_keywords:
            for w in kw.split():
                if len(w) >= 4:  # Hindari mencocokkan kata hubung pendek (di, ke, dll)
                    single_word_keywords.add(w)
                    
        for word in q_words:
            if len(word) >= 4:
                # Jika kemiripannya 80% ke atas, anggap sebagai follow up
                matches = difflib.get_close_matches(word, single_word_keywords, n=1, cutoff=0.8)
                if matches:
                    return True
                    
        return False
        
    def detect_topic_switch(self, question: str, current_name: str) -> bool:
        if not self.retriever:
            return False
            
        q_lower = question.lower()
        extracted = self.retriever.extract_keyword(q_lower)
        from app.rag.database_manager import get_database
        db = get_database()
        all_names = list(db.name_index.keys())
        
        db_words = set()
        for name in all_names:
            for w in name.replace("/", " ").replace("-", " ").split():
                if len(w) > 2: db_words.add(w)
                
        current_words = set(current_name.lower().replace("/", " ").replace("-", " ").split())
        extracted_words = set(extracted.split())
        
        ignore_words = {"bisa", "ceritakan", "letak", "simpan", "bentuk", "asal", "terbuat", "bahan", "koleksi", "museum", "ini", "itu", "yang", "dari", "pada", "untuk", "dengan", "dan", "alat", "benda", "kapan", "siapa", "dimana", "berapa", "sejarah", "cerita"}
        
        new_entity_words = (extracted_words.intersection(db_words) - current_words) - ignore_words
        return len(new_entity_words) > 0
