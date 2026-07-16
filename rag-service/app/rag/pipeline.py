from app.agent.chat_agent import ChatAgent

from app.core.dependencies import (
    get_llm,
    get_retriever
)

from app.services.memory_service import MemoryService
from app.services.prompt_service import PromptService


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

        selected_document = self.memory.get_selected_document(session_id)
        q_lower = (question or "").strip().lower()
        follow_up_keywords = [
            "terbuat dari",
            "fungsi",
            "asal",
            "dimana",
            "di mana",
            "lokasi",
            "siapa",
            "kapan",
            "berapa",
            "apa kegunaan",
            "apa tujuan"
        ]

        # =====================================================
        # FOLLOW-UP QUESTION: gunakan dokumen yang sudah dipilih
        # =====================================================
        if selected_document and any(keyword in q_lower for keyword in follow_up_keywords):

            documents = [selected_document]

            prompt = PromptService.create(
                question,
                documents
            )

            answer = self.llm.generate(prompt)

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

            return {
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
                    
                    return {
                        "answer": answer,
                        "documents": documents,
                        "sources": sources
                    }

        # =====================================================
        # USER SEDANG MEMILIH KOLEKSI (clarification flow)
        # =====================================================

        if self.memory.is_waiting(session_id):

            # try to resolve the user's reply to one of the candidates
            selected_name = self.memory.find_candidate(session_id, question)

            if not selected_name:

                # couldn't resolve selection; show candidates again
                candidates = self.memory.get_candidates(session_id)

                answer = (
                    "Saya tidak menemukan koleksi tersebut.\n\n"
                    "Silakan pilih salah satu berikut:\n\n"
                )

                for item in candidates:

                    answer += f"• {item}\n"

                return {

                    "answer": answer,

                    "documents": [],

                    "sources": []

                }

            # resolved to a candidate name; get all matching candidate documents
            candidate_docs = [
                d for d in self.memory.get_candidate_documents(session_id)
                if d is not None and d.metadata.get("name", "").lower() == selected_name.lower()
            ]

            # stop waiting
            self.memory.stop_clarification(session_id)

            if candidate_docs:

                self.memory.set_selected_document(session_id, candidate_docs[0])

                prompt_question = (
                    f"Jelaskan koleksi bernama {selected_name} secara detail. "
                    "Jika ada lebih dari satu, jelaskan masing-masing berdasarkan nomor registrasi atau inventarisasinya."
                )

                prompt = PromptService.create(prompt_question, candidate_docs)

                answer = self.llm.generate(prompt)

                sources = []
                for doc in candidate_docs:
                    sources.append({
                        "name": doc.metadata.get("name"),
                        "category": doc.metadata.get("category"),
                        "location": doc.metadata.get("location")
                    })

                self.memory.add_user(session_id, question)
                self.memory.add_ai(session_id, answer)

                return {
                    "answer": answer,
                    "documents": candidate_docs,
                    "sources": sources
                }

            else:
                return {
                    "answer": "Maaf, terjadi kesalahan saat memuat dokumen koleksi.",
                    "documents": [],
                    "sources": []
                }

        # =====================================================
        # AGENT
        # =====================================================

        result = self.agent.run(

            question

        )
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

            answer = f"{keyword} tergolong menjadi beberapa, ada "
            answer += ", ".join(candidates)
            answer += f" {keyword} apa yang anda maksud?"

            return {

                "answer": answer,

                "documents": [],

                "sources": []

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

        prompt = PromptService.create(
            question,
            documents
        )

        answer = self.llm.generate(

            prompt

        )

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

                    "name": doc.metadata.get("name"),

                    "category": doc.metadata.get("category"),

                    "location": doc.metadata.get("location")

                }

            )

        return {

            "answer": answer,

            "documents": documents,

            "sources": sources

        }