"""
backend/scripts/remove-backgrounds.py
Script otomatis untuk menghapus latar belakang studio foto artefak menggunakan AI (rembg U2Net).
Hasilnya disimpan sebagai file PNG transparan (.png) di folder yang sama.
"""

import os
import sys
import time
from PIL import Image

try:
    from rembg import remove
except ImportError:
    print("[ERROR] Library 'rembg' tidak ditemukan. Pastikan sudah menjalankan: pip install rembg onnxruntime")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(SCRIPT_DIR, '..', 'public', 'images')
CATEGORIES = ['etno', 'filo', 'seni']

def main():
    print("============================================================")
    print("  MEMULAI PENGHAPUSAN BACKGROUND AI (REMBG)")
    print("============================================================")

    total_processed = 0
    t0_global = time.time()

    for cat in CATEGORIES:
        cat_dir = os.path.join(IMAGES_DIR, cat)
        if not os.path.exists(cat_dir):
            continue

        files = sorted([f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.jpeg'))])
        print(f"\n[FOLDER] {cat}/ ({len(files)} file .jpg ditemukan)")

        for idx, filename in enumerate(files, 1):
            jpg_path = os.path.join(cat_dir, filename)
            png_filename = os.path.splitext(filename)[0] + '.png'
            png_path = os.path.join(cat_dir, png_filename)

            # Lewati jika file PNG sudah ada
            if os.path.exists(png_path):
                print(f"  [{idx}/{len(files)}] [SKIP] Sudah ada PNG transparan: {png_filename}")
                continue

            t0 = time.time()
            try:
                with Image.open(jpg_path) as input_img:
                    output_img = remove(input_img)
                    output_img.save(png_path, "PNG")
                dt = round(time.time() - t0, 2)
                print(f"  [{idx}/{len(files)}] [OK] {filename} -> {png_filename} ({dt}s)")
                total_processed += 1
            except Exception as e:
                print(f"  [{idx}/{len(files)}] [ERROR] Gagal memproses {filename}: {e}")

    duration = round(time.time() - t0_global, 2)
    print("\n============================================================")
    print(f"[SELESAI] {total_processed} gambar berhasil diproses dalam {duration} detik!")
    print("============================================================")

if __name__ == "__main__":
    main()
