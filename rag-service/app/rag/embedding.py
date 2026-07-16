from sentence_transformers import SentenceTransformer

from app.core.config import settings


class MuseumEmbedding:

    def __init__(self):

        print("Loading Embedding Model...")

        self.model = SentenceTransformer(
            settings.EMBEDDING_MODEL
        )

        print("Embedding Model Loaded")

    def embed_documents(self, texts):

        return self.model.encode(
            texts,
            convert_to_numpy=True
        ).tolist()

    def embed_query(self, text):

        return self.model.encode(
            text,
            convert_to_numpy=True
        ).tolist()