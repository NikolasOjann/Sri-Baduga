from openai import OpenAI
from app.core.config import settings

class OpenAIClient:
    def __init__(self):
        print("=" * 50)
        print("OPENAI API KEY :", "TERPASANG" if settings.OPENAI_API_KEY else "TIDAK DITEMUKAN")
        print("MODEL          :", settings.OPENAI_MODEL)
        print("=" * 50)

        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY
        )

        self.model = settings.OPENAI_MODEL
        self._cache = {}

    def generate(self, prompt: str) -> str:
        # Gunakan prompt sebagai cache key
        if prompt in self._cache:
            print("[OpenAI Cache HIT]")
            return self._cache[prompt]

        print("[OpenAI MISS] Generating response...")
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2048,
                temperature=0.7
            )
            answer = response.choices[0].message.content
        except Exception as e:
            print(f"[OpenAI ERROR] {str(e)}")
            answer = "Mohon maaf, server OpenAI sedang mengalami gangguan atau limit. Mohon coba beberapa saat lagi."
        
        # Batasi ukuran cache (misal 100)
        if len(self._cache) > 100:
            self._cache.pop(next(iter(self._cache)))
            
        self._cache[prompt] = answer

    def generate_stream(self, prompt):
        # We need a stable cache key, so if prompt is a list, we stringify it
        cache_key = str(prompt)
        
        if cache_key in self._cache:
            print("[OpenAI Cache HIT - Streaming]")
            words = self._cache[cache_key].split(" ")
            for w in words:
                yield w + " "
            return

        print("[OpenAI MISS] Generating stream response...")
        try:
            if isinstance(prompt, list):
                messages = prompt
            else:
                messages = [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]

            response_stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=2048,
                temperature=0.7,
                stream=True
            )
            
            full_answer = ""
            for chunk in response_stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_answer += text
                    yield text
                    
            if len(self._cache) > 100:
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = full_answer
            
        except Exception as e:
            print(f"[OpenAI ERROR Stream] {str(e)}")
            yield "Mohon maaf, server AI sedang mengalami gangguan. Silakan coba lagi."
