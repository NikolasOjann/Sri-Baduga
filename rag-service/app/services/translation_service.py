from app.translation.service import TranslationService


class TranslationManager:

    def __init__(self):
        self.service = TranslationService()

    def input(self, question):
        return self.service.preprocess(question)

    def output(self, answer, language):
        return self.service.postprocess(
            answer,
            language
        )