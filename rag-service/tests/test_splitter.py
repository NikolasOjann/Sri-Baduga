import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.core.config import settings
from app.rag.loader import MuseumLoader
from app.rag.splitter import MuseumSplitter


def main():

    print("=" * 60)
    print("Museum Splitter Test")
    print("=" * 60)

    loader = MuseumLoader(
        settings.DATASET
    )

    documents = loader.load()

    splitter = MuseumSplitter()

    chunks = splitter.split(documents)

    print()

    print("Jumlah Document :", len(documents))
    print("Jumlah Chunk :", len(chunks))

    print()

    print("=" * 60)
    print("Chunk Pertama")
    print("=" * 60)

    print()

    print(chunks[0].page_content)

    print()

    print("=" * 60)
    print("Metadata Chunk")
    print("=" * 60)

    print(chunks[0].metadata)


if __name__ == "__main__":
    main()