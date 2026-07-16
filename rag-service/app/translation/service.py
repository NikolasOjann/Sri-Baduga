from app.translation.detector import LanguageDetector
from app.translation.translator import Translator


class TranslationService:

    def preprocess(self, question):

        language = LanguageDetector.detect(question)

        if language == "id":
            return question, language

        translated = Translator.translate(
            question,
            source="auto",
            target="id"
        )

        return translated, language

    def postprocess(self, answer, language):

        if language == "id":
            return answer

        translated = Translator.translate(
            answer,
            source="id",
            target="en"
        )

        return translated