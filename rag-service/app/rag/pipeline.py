import re

from app.agent.chat_agent import ChatAgent

from app.core.dependencies import (
    get_llm,
    get_retriever
)

from app.services.memory_service import MemoryService
from app.services.prompt_service import PromptService
import difflib

# Global Cache untuk menyimpan jawaban RAG yang sudah pernah di-generate
_LLM_CACHE = {}

def normalize_query_for_cache(q: str) -> str:
    import re
    q_clean = re.sub(r'[^\w\s]', '', (q or "").lower())
    words = q_clean.split()
    stopwords = {"itu", "ini", "sih", "dong", "kalo", "kalau", "ya", "yang", "dan", "di", "ke", "dari", "nya"}
    words = [w for w in words if w not in stopwords]
    return " ".join(sorted(words))

def find_cached_result(question: str, selected_document):
    """Mencari cache dengan tingkat kemiripan pertanyaan yang tinggi setelah dinormalisasi."""
    q_norm = normalize_query_for_cache(question)
    doc_id = str(selected_document.metadata.get("id")) if selected_document else "none"
    
    possible_keys = [k for k in _LLM_CACHE.keys() if k.endswith(f"_{doc_id}")]
    for k in possible_keys:
        cached_q_norm = k.rsplit("_", 1)[0]
        # Jika kemiripan string sangat tinggi (misal: "apa tombak" vs "apa tombak")
        if difflib.SequenceMatcher(None, q_norm, cached_q_norm).ratio() > 0.80:
            return _LLM_CACHE[k]
    return None

def save_to_cache(question: str, selected_document, result: dict):
    q_norm = normalize_query_for_cache(question)
    doc_id = str(selected_document.metadata.get("id")) if selected_document else "none"
    cache_key = f"{q_norm}_{doc_id}"
    _LLM_CACHE[cache_key] = result

def strip_markdown(text: str) -> str:
    """Hapus formatting Markdown (bold, italic, heading) dari teks jawaban LLM."""
    if not text:
        return text
    # Hapus **bold** dan __bold__
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'__(.*?)__', r'\1', text)
    # Hapus *italic* dan _italic_
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'_(.*?)_', r'\1', text)
    # Hapus heading (#, ##, ###)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    return text.strip()


class MuseumPipeline:

    def __init__(self):

        get_retriever()

        self.agent = ChatAgent(
            get_llm()
        )

        self.memory = MemoryService()

        self.llm = get_llm()

    # =====================================================
    # ASK
    # =====================================================

    def ask(
        self,
        question,
        session_id
    ):
        q_lower = (question or "").strip().lower()
        
        # =====================================================
        # FAST GREETING INTERCEPT
        # =====================================================
        # Jika input sangat pendek dan merupakan sapaan, langsung balas tanpa LLM
        greetings = {"halo", "hallo", "haloo", "halloo", "helo", "hai", "hay", "alow", "allow", "hello", "hei", "hi", "pagi", "siang", "sore", "malam", "selamat", "punten", "sampurasun"}
        q_words = re.sub(r'[^\w\s]', '', q_lower).split()
        if len(q_words) <= 3 and any(w in greetings for w in q_words):
            answer = "Halo! Perkenalkan, saya Nyai, asisten virtual Museum Sri Baduga. Ada yang bisa saya bantu tentang koleksi atau informasi museum hari ini?"
            self.memory.add_user(session_id, question)
            self.memory.add_ai(session_id, answer)
            return {
                "answer": answer,
                "documents": [],
                "sources": [],
                "session_id": session_id
            }

        selected_document = self.memory.get_document(session_id)
        
        # =====================================================
        # CACHE CHECK (SMART SEMANTIC CACHE)
        # =====================================================
        cached_result = find_cached_result(question, selected_document)
        if cached_result:
            print("\n" + "="*60)
            print("SMART CACHE HIT! Mengembalikan jawaban instan.")
            print("="*60)
            self.memory.add_user(session_id, question)
            self.memory.add_ai(session_id, cached_result["answer"])
            return cached_result

        q_lower = (question or "").strip().lower()
        follow_up_keywords = [
            "terbuat dari", "dari apa", "bahan", "material",
            "fungsi", "kegunaan", "tujuan", "digunakan untuk",
            "asal", "ditemukan", "di peroleh", "dapat dari",
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

        # =====================================================
        # FOLLOW-UP QUESTION: gunakan dokumen yang sudah dipilih
        # =====================================================
        if selected_document and any(keyword in q_lower for keyword in follow_up_keywords):

            # -------------------------------------------------------
            # Deteksi topic-switch: jika user menyebut nama koleksi
            # yang BERBEDA dari selected_document, reset konteks dan
            # biarkan query jatuh ke pencarian baru.
            # -------------------------------------------------------
            current_name = selected_document.metadata.get("name", "").lower()
            
            # Gunakan logika pembersihan keyword yang sudah canggih dari retriever
            # untuk mendeteksi apakah ada penyebutan nama barang lain (meski typo)
            retriever = get_retriever()
            extracted = retriever.extract_keyword(q_lower)
            
            # Jika hasil ekstraksi menghasilkan nama barang yang valid di database
            # dan nama tersebut berbeda dari konteks saat ini, maka user telah berpindah topik
            from app.rag.database_manager import get_database
            db = get_database()
            all_names = list(db.name_index.keys())
            
            mentioned_other = False
            if extracted in all_names and extracted != current_name:
                mentioned_other = True

            if mentioned_other:
                # User ingin tanya tentang koleksi LAIN → reset selected_document
                print(f"[PIPELINE] Topic switch detected (from {current_name} to {extracted}), clearing context")
                self.memory.clear_document(session_id)
                selected_document = None
            else:
                documents = [selected_document]

                prompt = PromptService.create(
                    question,
                    documents
                )

                answer = strip_markdown(self.llm.generate(prompt))

                entity = self.memory.extract_entity(
                    question,
                    documents
                )

                if entity:
                    self.memory.set_entity(
                        session_id,
                        entity
                    )

                self.memory.add_user(
                    session_id,
                    question
                )

                self.memory.add_ai(
                    session_id,
                    answer
                )

                final_result = {
                    "answer": answer,
                    "documents": documents,
                    "sources": [
                        {
                            "name": selected_document.metadata.get("name"),
                            "category": selected_document.metadata.get("category"),
                            "location": selected_document.metadata.get("location")
                        }
                    ]
                }
                save_to_cache(question, selected_document, final_result)
                return final_result

        # =====================================================
        # FOLLOW-UP FALLBACK: jika selected_document kosong,
        # tambahkan konteks dari riwayat chat ke pertanyaan
        # =====================================================
        if not selected_document and any(keyword in q_lower for keyword in follow_up_keywords):
            history = self.memory.history(session_id)
            
            # Ambil pertanyaan user terakhir sebelum follow-up ini
            last_user_question = None
            for i in range(len(history) - 1, -1, -1):
                if history[i].get("role") == "user":
                    last_user_question = history[i].get("content")
                    break
            
            # Gabungkan pertanyaan sebelumnya dengan follow-up untuk konteks lebih baik
            if last_user_question:
                enhanced_question = f"{last_user_question}. Pertanyaan lanjutan: {question}"
                
                # Jalankan agent dengan pertanyaan yang diperkaya
                result = self.agent.run(enhanced_question)
                documents = result.get("documents", [])
                documents = [doc for doc in documents if doc is not None]
                
                # Set selected_document untuk follow-up pertanyaan selanjutnya
                if documents and documents[0] is not None:
                    self.memory.set_selected_document(session_id, documents[0])
                
                status = result["status"]
                
                if status == "success":
                    prompt = PromptService.create(question, documents)
                    answer = self.llm.generate(prompt)
                    
                    entity = self.memory.extract_entity(question, documents)
                    if entity:
                        self.memory.set_entity(session_id, entity)
                    
                    self.memory.add_user(session_id, question)
                    self.memory.add_ai(session_id, answer)
                    
                    sources = []
                    for doc in documents:
                        sources.append({
                            "name": doc.metadata.get("name"),
                            "category": doc.metadata.get("category"),
                            "location": doc.metadata.get("location")
                        })
                    
                    final_result = {
                        "answer": answer,
                        "documents": documents,
                        "sources": sources
                    }
                    save_to_cache(question, self.memory.get_document(session_id), final_result)
                    return final_result

        # =====================================================
        # USER SEDANG MEMILIH KOLEKSI (clarification flow)
        # =====================================================

        if self.memory.is_waiting(session_id):

            # try to resolve the user's reply to one of the candidates
            selected_name = self.memory.find_candidate(session_id, question)

            if not selected_name:
                # couldn't resolve selection
                # User is likely trying to search for something else or change topic.
                # Cancel the clarification state and let the query fall through to the normal search flow.
                self.memory.stop_clarification(session_id)
            else:
                # resolved to a candidate name; get all matching candidate documents
                candidate_docs = [
                    d for d in self.memory.get_candidate_documents(session_id)
                    if d is not None and d.metadata.get("name", "").lower() == selected_name.lower()
                ]

                # stop waiting
                self.memory.stop_clarification(session_id)

                if candidate_docs:

                    self.memory.set_document(session_id, candidate_docs[0])

                    prompt_question = (
                        f"Jelaskan koleksi bernama {selected_name} secara detail dan mengalir. "
                        "Jika ada lebih dari satu, jelaskan perbedaannya secara natural tanpa menyebutkan kata 'Nomor Registrasi', 'Inventarisasi', atau 'Dokumen'."
                    )

                    prompt = PromptService.create(prompt_question, candidate_docs)

                    answer = strip_markdown(self.llm.generate(prompt))

                    sources = []
                    for doc in candidate_docs:
                        sources.append({
                            "id": doc.metadata.get("id"),
                            "inventory": doc.metadata.get("inventory"),
                            "name": doc.metadata.get("name"),
                            "category": doc.metadata.get("category"),
                            "location": doc.metadata.get("location")
                        })

                    self.memory.add_user(session_id, question)
                    self.memory.add_ai(session_id, answer)

                    final_result = {
                        "answer": answer,
                        "documents": candidate_docs,
                        "sources": sources
                    }
                    # Jangan cache pertanyaan klarifikasi karena konteksnya transisi
                    return final_result

                else:
                    return {
                        "answer": "Maaf, terjadi kesalahan saat memuat dokumen koleksi.",
                        "documents": [],
                        "sources": []
                    }

        # =====================================================
        # PRE-CHECK: Pertanyaan daftar / klasifikasi koleksi
        # Pola: "klasifikasi", "jenis koleksi", "ada apa saja", dll.
        # =====================================================
        from app.tools.museum_collection_tool import CATEGORY_INFO, MuseumCollectionTool

        q_clean = (question or "").strip().lower()

        collection_list_keywords = [
            # Bahasa Indonesia formal
            "klasifikasi", "jenis koleksi", "jenis-jenis", "ada apa saja",
            "apa saja koleksi", "koleksi apa saja", "koleksi ada apa",
            "ada apa di museum", "isi museum", "apa yang ada", "benda apa saja",
            "tampilkan koleksi", "daftar koleksi", "kategori koleksi", "tipe koleksi",
            "semua koleksi", "ada koleksi apa", "tampilkan semua", "kategori apa",
            "apa saja jenisnya", "jenis benda", "koleksi benda", "macam macam", "macam-macam",
            "jenis jenis",
            # Kata "terdapat", "isinya", "berisi" — pola umum pengguna
            "terdapat apa", "ada item apa", "terdapat item", "berisi apa", "isinya apa",
            "item apa saja", "benda apa yang ada", "koleksi apa yang ada",
            "apa yang terdapat", "apa yang tersimpan", "ada benda apa",
            # Variasi santai / singkat
            "ada apa", "apa aja", "ada apa aja", "isinya", "isi nya", "itemnya",
            "item nya", "koleksinya", "koleksi nya",
        ]

        # ── Cek 1: pertanyaan menyebut nama kategori + kata tanya koleksi
        # Contoh: "pada seni rupa terdapat item apa?" → deteksi "seni rupa" + "item"
        category_keys = list(CATEGORY_INFO.keys())  # e.g. "seni rupa", "etnografika"
        inquiry_words = [
            "terdapat", "tersimpan", "berisi", "isinya", "item", "koleksi",
            "ada apa", "apa saja", "apa aja", "benda", "apa yang"
        ]
        
        result = None
        for cat_key in category_keys:
            if cat_key in q_clean:
                if any(iw in q_clean for iw in inquiry_words):
                    # Arahkan ke pencarian langsung berdasarkan nama kategori
                    from app.tools.museum_search_tool import MuseumSearchTool
                    search_tool = MuseumSearchTool(get_retriever())
                    bypass_result = search_tool.run(question=cat_key, context=self.agent.context)
                    if bypass_result.get("status") in ["success", "clarification"]:
                        result = bypass_result
                        print(f"\n[PIPELINE] CATEGORY BYPASS ACTIVATED for: {cat_key}")
                    break
                    
        if result:
            pass # Skip Cek 2 jika Cek 1 sudah dapat hasil
        # ── Cek 2: keyword daftar klasifikasi umum ada di pertanyaan
        elif any(kw in q_clean for kw in collection_list_keywords):
            col_tool = MuseumCollectionTool(get_retriever())
            return col_tool.run(question=question)

        # =====================================================
        # PRE-CHECK: Pertanyaan definisi kategori tertentu
        # Pola: "apa itu X", "jelaskan X", "X itu apa"
        # =====================================================
        cat_definition_patterns = [
            r"apa itu (.+)",
            r"apa yang dimaksud (.+)",
            r"jelaskan (.+)",
            r"(.+) itu apa",
            r"pengertian (.+)",
            r"definisi (.+)",
            r"maksud dari (.+)",
            r"arti dari (.+)",
            r"(.+) berarti",
            r"(.+) artinya"
        ]
        all_cat_keys = list(CATEGORY_INFO.keys())

        for pat in cat_definition_patterns:
            m = re.search(pat, q_clean)
            if m:
                kw = m.group(1).strip()
                cat_matches = difflib.get_close_matches(kw, all_cat_keys, n=1, cutoff=0.6)
                if not cat_matches:
                    for k in all_cat_keys:
                        if kw in k or k in kw:
                            cat_matches = [k]
                            break
                if cat_matches:
                    col_tool = MuseumCollectionTool(get_retriever())
                    return col_tool.run(question=question)

        # =====================================================
        # FAST PATH (BYPASS LLM PLANNER)
        # Jika query pendek (<= 4 kata), coba cari langsung
        # ke database sebelum menyuruh LLM Planner menganalisis
        # agar lebih cepat dan tidak terjadi halusinasi
        # =====================================================
        
        # q_clean sudah didefinisikan di atas
        word_count = len(q_clean.split())
        
        general_keywords = [
            "jam", "buka", "tutup", "tiket", "htm", "lokasi", "alamat", "sejarah", 
            "halo", "hai", "hey", "hi", "terima kasih", "makasih", "ada apa", 
            "apa saja", "siapa", "daftar", "harga", "biaya", "masuk", "parkir", 
            "fasilitas", "toilet", "mushola", "panduan", "rute", "denah", "jadwal",
            "selamat pagi", "selamat siang", "selamat sore", "selamat malam"
        ]
        
        if result is None and word_count > 0 and word_count <= 4 and not any(k in q_clean for k in general_keywords):
            print("\n" + "="*60)
            print("FAST PATH SEARCH ACTIVATED")
            print("="*60)
            from app.tools.museum_search_tool import MuseumSearchTool
            fast_tool = MuseumSearchTool(get_retriever())
            fast_result = fast_tool.run(question=question, context=self.agent.context)
            
            # Jika Fast Path berhasil menemukan kandidat, gunakan hasilnya
            if fast_result.get("status") in ["success", "clarification"]:
                result = fast_result
                print("Fast Path Success!")
            else:
                print("Fast Path Empty, fallback to LLM Planner...")
        
        # =====================================================
        # EXACT ITEM BYPASS (ANTI-HALLUCINATION)
        # Jika algoritma ekstraksi berhasil menemukan nama barang 
        # yang valid di database, kita paksa pencarian ke barang tersebut!
        # Ini mencegah AI Agent berhalusinasi (misal: mengira "tombak di mana" 
        # berarti menanyakan lokasi/alamat museum).
        # =====================================================
        if result is None:
            extracted_item = get_retriever().extract_keyword(q_clean)
            from app.rag.database_manager import get_database
            db_names = list(get_database().name_index.keys())
            
            if extracted_item in db_names:
                print(f"\n[PIPELINE] EXACT ITEM BYPASS ACTIVATED for: {extracted_item}")
                from app.tools.museum_search_tool import MuseumSearchTool
                search_tool = MuseumSearchTool(get_retriever())
                # Kita gunakan query asli (question) agar 'terbuat dari' dll tetap terbaca di context
                bypass_result = search_tool.run(question=question, context=self.agent.context)
                if bypass_result.get("status") in ["success", "clarification"]:
                    result = bypass_result
                    print(f"Exact Bypass Success! Status: {result.get('status')}")

        # =====================================================
        # AGENT (Fallback ke LLM Planner jika tidak ada cara cepat)
        # =====================================================

        if result is None:
            result = self.agent.run(
                question
            )
            
        if result is None or result.get("status") == "none":
            # Jika Planner AI mengembalikan NONE, jangan paksa RAG LLM
            # untuk menjawab dengan dokumen kosong. Langsung kembalikan pesan ramah.
            return {
                "answer": "Halo! Saya adalah AI Assistant Museum Sri Baduga. Ada yang bisa saya bantu terkait informasi museum atau koleksinya?",
                "documents": [],
                "sources": []
            }

        documents = result.get("documents", [])

        documents = [
            doc
            for doc in documents
            if doc is not None
        ]

        result["documents"] = documents

        status = result["status"]

        # =====================================================
        # CLARIFICATION
        # =====================================================

        if status == "clarification":

            self.memory.start_clarification(

                session_id,

                result["candidates"],
                result["documents"]

            )

            keyword = result["keyword"]
            candidates = result["candidates"]

            answer = f"Saya menemukan beberapa koleksi terkait '{keyword}'. Silakan lihat daftar di bawah ini dan beri tahu saya spesifik koleksi yang Anda maksud."

            documents = result.get("documents", [])

            # Deduplikasi: tampilkan hanya 1 kartu per nama unik di mode clarification
            seen_names = set()
            sources = []
            for doc in documents:
                name = doc.metadata.get("name")
                if name not in seen_names:
                    seen_names.add(name)
                    sources.append({
                        "id": doc.metadata.get("id"),
                        "inventory": doc.metadata.get("inventory"),
                        "name": name,
                        "category": doc.metadata.get("category"),
                        "location": doc.metadata.get("location")
                    })

            return {

                "answer": answer,

                "documents": documents,

                "sources": sources

            }

        # =====================================================
        # EMPTY
        # =====================================================

        if status == "empty":

            answer = (
                "Mohon maaf,\n\n"
                "informasi tersebut belum tersedia "
                "pada database Museum Sri Baduga."
            )

            return {

                "answer": answer,

                "documents": [],

                "sources": []

            }

        # =====================================================
        # SUCCESS
        # =====================================================

        documents = result["documents"]

        if len(documents) == 1 and documents[0] is not None:
            self.memory.set_selected_document(session_id, documents[0])

        print("\n" + "="*60)
        print("PIPELINE DEBUG")
        print("="*60)

        print("Question :", question)
        print("Documents :", documents)

        for i, doc in enumerate(documents):
            print(f"\nDocument {i}")
            print("Type :", type(doc))
            print("Value :", doc)

            if doc is not None:
                print("Name :", doc.metadata.get("name"))

        print("="*60)

        # =====================================================
        # SIMPAN DOKUMEN PALING RELEVANT UNTUK FOLLOW-UP QUESTIONS
        # =====================================================
        if documents and documents[0] is not None:
            self.memory.set_selected_document(session_id, documents[0])

        # Gunakan answer dari tool jika sudah disediakan, 
        # jika tidak ada, suruh LLM generate berdasarkan dokumen
        answer = result.get("answer")
        
        if not answer:
            
            prompt_q = question
            # Jika user hanya mengetik kata kunci singkat tanpa kalimat tanya (misal: "tombak", "golok"),
            # bantu LLM (terutama model literal seperti Gemini) dengan kalimat perintah agar dijawab lengkap.
            if len(question.split()) <= 3 and not any(w in question.lower() for w in ["apa", "siapa", "dimana", "kapan", "bagaimana", "mengapa", "jelaskan", "ceritakan", "?"]):
                prompt_q = f"Jelaskan informasi lengkap mengenai {question} berdasarkan dokumen yang ada."
                
            prompt = PromptService.create(
                prompt_q,
                documents
            )

            answer = strip_markdown(self.llm.generate(
                prompt
            ))

        entity = self.memory.extract_entity(

            question,

            documents

        )

        if entity:

            self.memory.set_entity(

                session_id,

                entity

            )

        self.memory.add_user(

            session_id,

            question

        )

        self.memory.add_ai(

            session_id,

            answer

        )

        sources = []

        for doc in documents:

            sources.append(

                {

                    "id": doc.metadata.get("id"),

                    "inventory": doc.metadata.get("inventory"),

                    "name": doc.metadata.get("name"),

                    "category": doc.metadata.get("category"),

                    "location": doc.metadata.get("location")

                }

            )

        final_result = {
            "answer": answer,
            "documents": documents,
            "sources": sources
        }
        
        save_to_cache(question, self.memory.get_document(session_id), final_result)
        return final_result