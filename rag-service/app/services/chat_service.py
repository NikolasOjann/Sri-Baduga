from app.rag.pipeline import MuseumPipeline


class ChatService:

    def __init__(self):

        self.pipeline = MuseumPipeline()

    # =====================================================
    # ASK
    # =====================================================

    def ask(

        self,

        question,

        session_id="default"

    ):

        return self.pipeline.ask(

            question,

            session_id

        )