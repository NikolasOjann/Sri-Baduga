import re
import difflib
import json
from app.agent.chat_agent import ChatAgent
from app.core.dependencies import get_llm, get_retriever
from app.services.memory_service import MemoryService
from app.services.prompt_service import PromptService
from app.agent.query_router import QueryRouter
from app.tools.museum_search_tool import MuseumSearchTool
from app.tools.museum_collection_tool import MuseumCollectionTool

_LLM_CACHE = {}

def normalize_query_for_cache(q: str) -> str:
    q_clean = re.sub(r'[^\w\s]', '', (q or "").lower())
    words = q_clean.split()
    stopwords = {"itu", "ini", "sih", "dong", "kalo", "kalau", "ya", "yang", "dan", "di", "ke", "dari", "nya"}
    words = [w for w in words if w not in stopwords]
    return " ".join(sorted(words))

def clear_llm_cache():
    _LLM_CACHE.clear()

def find_cached_result(question: str, selected_document):
    q_norm = normalize_query_for_cache(question)
    doc_id = str(selected_document.metadata.get("id")) if selected_document else "none"
    possible_keys = [k for k in _LLM_CACHE.keys() if k.endswith(f"_{doc_id}")]
    for k in possible_keys:
        cached_q_norm = k.rsplit("_", 1)[0]
        if difflib.SequenceMatcher(None, q_norm, cached_q_norm).ratio() > 0.80:
            return _LLM_CACHE[k]
    return None

def save_to_cache(question: str, selected_document, result: dict):
    q_norm = normalize_query_for_cache(question)
    doc_id = str(selected_document.metadata.get("id")) if selected_document else "none"
    cache_key = f"{q_norm}_{doc_id}"
    _LLM_CACHE[cache_key] = result

def strip_markdown(text: str) -> str:
    if not text: return text
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'__(.*?)__', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'_(.*?)_', r'\1', text)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    return text.strip()


class MuseumPipeline:
    def __init__(self):
        self.retriever = get_retriever()
        self.agent = ChatAgent(get_llm())
        self.memory = MemoryService()
        self.llm = get_llm()
        self.router = QueryRouter(self.retriever)

    def _prepare_sources(self, documents):
        seen_names = set()
        sources = []
        for doc in documents:
            if not doc: continue
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
        return sources

    def _process_logic(self, question: str, session_id: str) -> dict:
        """ Core logic returns a dict describing what to do next. """
        q_lower = (question or "").strip().lower()
        selected_document = self.memory.get_document(session_id)

        # 1. Cache Check
        cached_result = find_cached_result(question, selected_document)
        if cached_result:
            if cached_result.get("documents") and len(cached_result["documents"]) > 0:
                self.memory.set_selected_document(session_id, cached_result["documents"][0])
            return {"type": "instant", "result": cached_result, "cache_hit": True}

        # 2. Clarification Flow
        if self.memory.is_waiting(session_id):
            selected_name = self.memory.find_candidate(session_id, question)
            if not selected_name:
                self.memory.stop_clarification(session_id)
            else:
                candidate_docs = [
                    d for d in self.memory.get_candidate_documents(session_id)
                    if d is not None and d.metadata.get("name", "").lower() == selected_name.lower()
                ]
                self.memory.stop_clarification(session_id)
                if candidate_docs:
                    self.memory.set_document(session_id, candidate_docs[0])
                    prompt_q = f"Jelaskan koleksi {selected_name} secara singkat, ramah, dan menarik."
                    prompt = PromptService.create(prompt_q, candidate_docs, history=self.memory.history(session_id))
                    return {
                        "type": "llm", 
                        "prompt": prompt, 
                        "documents": candidate_docs, 
                        "sources": self._prepare_sources(candidate_docs),
                        "skip_cache": True
                    }
                else:
                    return {"type": "instant", "result": {"answer": "Maaf, terjadi kesalahan saat memuat dokumen koleksi.", "documents": [], "sources": []}}

        # 3. Follow-up Logic
        if selected_document and self.router.is_follow_up(q_lower):
            current_name = selected_document.metadata.get("name", "")
            if self.router.detect_topic_switch(q_lower, current_name):
                self.memory.clear_document(session_id)
                selected_document = None
            else:
                prompt = PromptService.create(question, [selected_document], history=self.memory.history(session_id))
                return {
                    "type": "llm",
                    "prompt": prompt,
                    "documents": [selected_document],
                    "sources": self._prepare_sources([selected_document])
                }

        if not selected_document and self.router.is_follow_up(q_lower):
            history = self.memory.history(session_id)
            last_user_question = next((h.get("content") for h in reversed(history) if h.get("role") == "user" and h.get("content") != question), None)
            if last_user_question:
                enhanced_question = f"{last_user_question}. Pertanyaan lanjutan: {question}"
                result = self.agent.run(enhanced_question)
                docs = [d for d in result.get("documents", []) if d]
                if docs:
                    self.memory.set_selected_document(session_id, docs[0])
                if result["status"] == "success":
                    prompt = PromptService.create(question, docs, history=self.memory.history(session_id))
                    return {"type": "llm", "prompt": prompt, "documents": docs, "sources": self._prepare_sources(docs)}

        # 4. Route Query (Replaces bloated pipeline logic)
        route_intent = self.router.route(question)
        intent = route_intent["intent"]

        if intent == "greeting":
            return {"type": "instant", "result": {
                "answer": "Halo! Perkenalkan, saya Nyai, asisten virtual Museum Sri Baduga. Ada yang bisa saya bantu tentang koleksi atau informasi museum hari ini?",
                "documents": [], "sources": []
            }}

        result = None
        if intent == "collection_list" or intent == "category_definition":
            result = MuseumCollectionTool(self.retriever).run(question=question)
        elif intent == "exact_search":
            result = MuseumSearchTool(self.retriever).run(question=question, context=self.agent.context)
        elif intent == "fast_search":
            fast_result = MuseumSearchTool(self.retriever).run(question=question, context=self.agent.context)
            if fast_result.get("status") in ["success", "clarification"]:
                result = fast_result

        # Fallback to Agent Planner
        if result is None:
            result = self.agent.run(question)

        if result is None or result.get("status") == "none":
            return {"type": "instant", "result": {
                "answer": "Halo! Saya adalah AI Assistant Museum Sri Baduga. Ada yang bisa saya bantu terkait informasi museum atau koleksinya?",
                "documents": [], "sources": []
            }}

        status = result.get("status")
        docs = [d for d in result.get("documents", []) if d]
        
        if status == "clarification":
            self.memory.start_clarification(session_id, result["candidates"], docs)
            answer = f"Saya menemukan beberapa koleksi terkait '{result['keyword']}'. Silakan lihat daftar di bawah ini dan beri tahu saya spesifik koleksi yang Anda maksud."
            return {"type": "instant", "result": {"answer": answer, "documents": docs, "sources": self._prepare_sources(docs)}}
            
        if status == "empty":
            return {"type": "instant", "result": {
                "answer": "Mohon maaf,\ninformasi tersebut belum tersedia pada database Museum Sri Baduga.",
                "documents": [], "sources": []
            }}

        # Success Status
        if docs:
            self.memory.set_selected_document(session_id, docs[0])

        answer = result.get("answer")
        if answer:
            return {"type": "instant", "result": {"answer": answer, "documents": docs, "sources": self._prepare_sources(docs)}}
        else:
            prompt_q = question
            if len(question.split()) <= 3 and not any(w in question.lower() for w in ["apa", "siapa", "dimana", "kapan", "bagaimana", "mengapa", "jelaskan", "ceritakan", "?"]):
                prompt_q = f"Jelaskan apa itu {question} secara singkat dan ramah."
            prompt = PromptService.create(prompt_q, docs, history=self.memory.history(session_id))
            return {"type": "llm", "prompt": prompt, "documents": docs, "sources": self._prepare_sources(docs)}

    def ask(self, question, session_id):
        logic = self._process_logic(question, session_id)
        
        if logic["type"] == "instant":
            res = logic["result"]
            if not logic.get("cache_hit"):
                self.memory.add_user(session_id, question)
                self.memory.add_ai(session_id, res["answer"])
            return res
            
        elif logic["type"] == "llm":
            answer = strip_markdown(self.llm.generate(logic["prompt"]))
            docs = logic["documents"]
            
            entity = self.memory.extract_entity(question, docs)
            if entity: self.memory.set_entity(session_id, entity)
                
            self.memory.add_user(session_id, question)
            self.memory.add_ai(session_id, answer)
            
            final_res = {"answer": answer, "documents": docs, "sources": logic["sources"]}
            if not logic.get("skip_cache"):
                save_to_cache(question, self.memory.get_document(session_id), final_res)
            return final_res

    async def ask_stream(self, question, session_id):
        logic = self._process_logic(question, session_id)
        
        if logic["type"] == "instant":
            res = logic["result"]
            if not logic.get("cache_hit"):
                self.memory.add_user(session_id, question)
                self.memory.add_ai(session_id, res["answer"])
                
            # Stream the instant answer chunk by chunk (simulated typing)
            words = res["answer"].split(" ")
            for w in words:
                yield f"data: {json.dumps({'type': 'chunk', 'text': w + ' '})}\n\n"
                
            final_data = {
                'type': 'final', 
                'sources': res.get('sources', []),
                'options': res.get('options', [])
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            
        elif logic["type"] == "llm":
            docs = logic["documents"]
            full_answer = ""
            
            # Real streaming from Ollama
            for chunk in self.llm.generate_stream(logic["prompt"]):
                clean_chunk = chunk # (In a real app we might strip markdown on the fly, but it's hard with chunks)
                full_answer += clean_chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': clean_chunk})}\n\n"
                
            full_answer = strip_markdown(full_answer)
            
            entity = self.memory.extract_entity(question, docs)
            if entity: self.memory.set_entity(session_id, entity)
                
            self.memory.add_user(session_id, question)
            self.memory.add_ai(session_id, full_answer)
            
            final_res = {"answer": full_answer, "documents": docs, "sources": logic["sources"]}
            if not logic.get("skip_cache"):
                save_to_cache(question, self.memory.get_document(session_id), final_res)
                
            final_data = {
                'type': 'final',
                'sources': logic['sources'],
                'options': logic.get('options', [])
            }
            yield f"data: {json.dumps(final_data)}\n\n"