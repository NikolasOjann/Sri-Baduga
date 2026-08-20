from app.rag.pipeline import MuseumPipeline


class ChatService:

    def __init__(self):

        self.pipeline = MuseumPipeline()

    # =====================================================
    # ASK
    # =====================================================

    def ask(self, question, session_id="default"):
        try:
            return self.pipeline.ask(question, session_id)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "answer": f"Terjadi kesalahan pada server AI: {str(e)}",
                "sources": [],
                "options": [],
                "artifacts": []
            }