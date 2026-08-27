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

    async def ask_stream(self, question, session_id="default"):
        try:
            async for chunk in self.pipeline.ask_stream(question, session_id):
                yield chunk
        except Exception as e:
            import traceback
            traceback.print_exc()
            import json
            yield f"data: {json.dumps({'type': 'chunk', 'text': f'Terjadi kesalahan: {str(e)}'})}\n\n"
            yield f"data: {json.dumps({'type': 'final', 'sources': []})}\n\n"