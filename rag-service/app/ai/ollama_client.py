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

    def generate(self, prompt):

        response = self.client.chat(

            model=self.model,

            messages=[

                {
                    "role": "user",
                    "content": prompt
                }

            ]

        )

        return response["message"]["content"]