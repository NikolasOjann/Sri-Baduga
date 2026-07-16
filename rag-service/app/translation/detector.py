import re


class LanguageDetector:
    """
    Hanya mendeteksi:
    - Indonesia (id)
    - Inggris (en)

    Selain itu dianggap Bahasa Indonesia.
    """

    ENGLISH_PATTERNS = [
        r"\bwhat\b",
        r"\bwho\b",
        r"\bwhere\b",
        r"\bwhen\b",
        r"\bwhy\b",
        r"\bhow\b",
        r"\btell me\b",
        r"\bdescribe\b",
        r"\bexplain\b",
        r"\bhistory\b",
        r"\bmuseum\b",
        r"\bcollection\b",
        r"\bartifact\b",
        r"\btraditional\b",
        r"\bweapon\b",
        r"\bculture\b",
        r"\borigin\b",
        r"\bkingdom\b",
    ]

    @classmethod
    def detect(cls, text: str) -> str:

        text = text.lower()

        for pattern in cls.ENGLISH_PATTERNS:

            if re.search(pattern, text):
                return "en"

        return "id"