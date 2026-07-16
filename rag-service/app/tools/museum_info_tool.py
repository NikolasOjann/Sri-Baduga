
# =====================================================
# Museum Info Tool
# Menangani pertanyaan umum tentang Museum Sri Baduga
# (jam buka, lokasi, tiket, sejarah, koleksi apa saja, dll)
# =====================================================

from langchain_core.documents import Document

# Informasi statis Museum Sri Baduga yang dijadikan konteks utama
MUSEUM_INFO = """
Nama Museum    : Museum Sri Baduga
Lokasi/Alamat  : Jl. BKR No.185, Pelindung Hewan, Astanaanyar, Kota Bandung, Jawa Barat 40243
Jam Operasional:
  - Selasa s.d. Kamis : 08.00 – 16.00 WIB
  - Jumat              : 08.00 – 16.30 WIB
  - Sabtu & Minggu     : 08.00 – 14.00 WIB
  - Senin & Hari Libur Nasional : TUTUP
Harga Tiket (HTM):
  - Umum / Dewasa : Rp 5.000
  - Pelajar / Mahasiswa : Rp 3.000
  - Anak-anak (di bawah 5 tahun): GRATIS
  - Wisatawan Mancanegara: Rp 10.000
Telepon        : (022) 5210976
Sejarah        :
  Museum Sri Baduga merupakan museum provinsi Jawa Barat yang diresmikan pada tanggal
  5 Juni 1980 oleh Menteri Pendidikan dan Kebudayaan. Nama "Sri Baduga" diambil dari
  gelar raja Sunda, yaitu Sri Baduga Maharaja (Prabu Siliwangi), raja Kerajaan Sunda
  yang memerintah antara tahun 1482–1521.
  Museum ini menyimpan dan memamerkan koleksi benda-benda budaya Jawa Barat dan Sunda.
Koleksi Museum :
  Museum Sri Baduga memiliki ribuan koleksi yang terbagi dalam beberapa kategori, antara lain:
  - Geologika & Geografika : batu-batuan, fosil, dan peta
  - Biologika              : flora dan fauna khas Jawa Barat
  - Etnografika            : benda-benda budaya masyarakat Sunda (pakaian, alat rumah tangga, senjata tradisional seperti kujang, golok, keris, dll)
  - Arkeologika            : benda purbakala dari berbagai situs di Jawa Barat
  - Historika              : dokumen dan benda bersejarah
  - Numismatika & Heraldika: koleksi mata uang dan lambang
  - Filologika             : naskah-naskah kuno (Sunda)
  - Keramologika           : tembikar dan keramik
  - Seni Rupa              : lukisan dan karya seni
  - Teknologika            : alat-alat teknologi tradisional
"""


class MuseumInfoTool:

    def __init__(self, retriever=None):
        # retriever opsional; digunakan untuk memperkaya jawaban
        self.retriever = retriever

    # =====================================================
    # TOOL NAME
    # =====================================================

    @property
    def name(self):
        return "museum_info"

    # =====================================================
    # DESCRIPTION
    # =====================================================

    @property
    def description(self):
        return (
            "Menjawab pertanyaan umum tentang Museum Sri Baduga "
            "(jam buka, lokasi, tiket, sejarah, koleksi apa saja, dll)."
        )

    # =====================================================
    # RUN
    # =====================================================

    def run(self, question=None, query=None, context=None, **kwargs):
        question = question or query or ""

        print()
        print("=" * 60)
        print("MUSEUM INFO TOOL")
        print("=" * 60)
        print("Question :", question)

        info_doc = Document(
            page_content=MUSEUM_INFO,
            metadata={
                "name": "Informasi Umum Museum Sri Baduga",
                "category": "informasi",
                "location": "Bandung, Jawa Barat"
            }
        )

        print("Status : SUCCESS (info statis)")
        print("=" * 60)

        return {
            "tool": "museum_info",
            "status": "success",
            "documents": [info_doc]
        }
