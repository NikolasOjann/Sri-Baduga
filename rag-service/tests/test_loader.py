import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

sys.path.append(str(BASE_DIR))

from app.core.config import settings
from app.rag.loader import MuseumLoader


def main():

    print("=" * 60)
    print("Museum Loader Test")
    print("=" * 60)

    loader = MuseumLoader(
        settings.DATASET
    )

    documents = loader.load()

    print()

    print("Jumlah Document :", len(documents))

    print()

    print("=" * 60)
    print("Document Pertama")
    print("=" * 60)

    print()

    print(documents[0].page_content)

    print()

    print("=" * 60)
    print("Metadata")
    print("=" * 60)

    print(documents[0].metadata)


if __name__ == "__main__":
    main()