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
        response = self.client.chat(

            model=self.model,

            messages=[

                {
                    "role": "user",
                    "content": prompt
                }

            ]

        )
        
        answer = response["message"]["content"]
        
        # Batasi ukuran cache (misal 100)
        if len(self._cache) > 100:
            self._cache.pop(next(iter(self._cache)))
            
        self._cache[prompt] = answer

        return answer