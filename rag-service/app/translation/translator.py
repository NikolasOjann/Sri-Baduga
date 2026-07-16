from deep_translator import GoogleTranslator


class Translator:

    @staticmethod
    def translate(text, source="auto", target="id"):

        return GoogleTranslator(

            source=source,

            target=target

        ).translate(text)