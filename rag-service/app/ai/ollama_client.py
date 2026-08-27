import ollama
from app.core.config import settings


class OllamaClient:

    def __init__(self):

        print("=" * 50)
        print("OLLAMA URL :", settings.OLLAMA_URL)
        print("MODEL       :", settings.LLM_MODEL)
        print("=" * 50)

        self.client = ollama.Client(
            host=settings.OLLAMA_URL
        )

        self.model = settings.LLM_MODEL
        self._cache = {}

    def generate(self, prompt):
        
        # Gunakan prompt sebagai cache key
        if prompt in self._cache:
            print("[Ollama Cache HIT]")
            return self._cache[prompt]

        print("[Ollama MISS] Generating response...")
        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                options={
                    "num_ctx": 2048  # Batasi konteks agar tidak OOM
                }
            )
            answer = response["message"]["content"]
        except Exception as e:
            print(f"[Ollama ERROR] {str(e)}")
            answer = "Mohon maaf, server AI sedang kehabisan memori (Out of Memory) atau mengalami gangguan. Mohon tutup aplikasi lain yang memberatkan laptop, lalu coba lagi ya."
        
        # Batasi ukuran cache (misal 100)
        if len(self._cache) > 100:
            self._cache.pop(next(iter(self._cache)))
            
        self._cache[prompt] = answer

        return answer

    def generate_stream(self, prompt):
        
        if prompt in self._cache:
            print("[Ollama Cache HIT - Streaming]")
            # Yield cached answer chunk by chunk (simulate streaming)
            words = self._cache[prompt].split(" ")
            for w in words:
                yield w + " "
            return

        print("[Ollama MISS] Generating stream response...")
        try:
            response_stream = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                options={
                    "num_ctx": 2048
                },
                stream=True
            )
            
            full_answer = ""
            for chunk in response_stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    text = chunk['message']['content']
                    full_answer += text
                    yield text
                    
            # Cache the full answer after streaming is done
            if len(self._cache) > 100:
                self._cache.pop(next(iter(self._cache)))
            self._cache[prompt] = full_answer
            
        except Exception as e:
            print(f"[Ollama ERROR Stream] {str(e)}")
            yield "Mohon maaf, server AI sedang mengalami gangguan. Silakan coba lagi."