import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.utils.cleaner import TextCleaner

sample = """
Nama Koleksi :

Kujang



Kategori :

Senjata Tradisional
"""

print("=" * 50)
print("SEBELUM")
print("=" * 50)
print(sample)

cleaned = TextCleaner.clean(sample)

print("\n" + "=" * 50)
print("SESUDAH")
print("=" * 50)
print(cleaned)