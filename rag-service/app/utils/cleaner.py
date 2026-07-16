import re


class TextCleaner:
    """
    Membersihkan teks sebelum dilakukan proses embedding.
    """

    @staticmethod
    def clean(text: str) -> str:

        # Hilangkan newline
        text = text.replace("\n", " ")

        # Hilangkan spasi berlebih
        text = re.sub(r"\s+", " ", text)

        # Hilangkan spasi depan & belakang
        text = text.strip()

        return text