"""
backend/scripts/remove-single-bg.py
Script otomatis untuk menghapus latar belakang satu file gambar menggunakan AI (rembg).
Usage: python remove-single-bg.py <input_jpg> <output_png>
"""

import sys
import os
import time
from PIL import Image

try:
    from rembg import remove
except ImportError:
    print("[ERROR] Library 'rembg' tidak ditemukan.")
    sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print("Usage: python remove-single-bg.py <input_jpg> <output_png>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"[ERROR] File tidak ditemukan: {input_path}")
        sys.exit(1)

    print(f"[PYTHON] Menghapus background: {input_path}")
    t0 = time.time()

    try:
        with Image.open(input_path) as input_img:
            # Gunakan post_process_mask agar lubang kecil di dalam objek/artefak tidak terhapus
            output_img = remove(input_img, post_process_mask=True)
            
            # Validasi agar tidak menghapus objek utama
            alpha = output_img.split()[3]
            bbox = alpha.getbbox()
            w, h = input_img.size
            
            if not bbox:
                print(f"[WARNING] AI menghapus seluruh gambar! Mencoba tanpa post_process_mask...")
                output_img = remove(input_img)
                alpha = output_img.split()[3]
                bbox = alpha.getbbox()
                
            if bbox:
                box_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                if box_area < (w * h * 0.02):
                    print(f"[WARNING] Objek terlalu kecil/terhapus. Tetap menyimpan original PNG.")
                    output_img.save(output_path, "PNG")
                else:
                    output_img.save(output_path, "PNG")
            else:
                print(f"[ERROR] Gagal mempertahankan objek pada {input_path}. Lewati agar gambar tidak rusak.")
                sys.exit(1)

        dt = round(time.time() - t0, 2)
        print(f"[PYTHON] Sukses ({dt}s) -> {output_path}")
        sys.exit(0)

    except Exception as e:
        print(f"[ERROR] Gagal memproses {input_path}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
