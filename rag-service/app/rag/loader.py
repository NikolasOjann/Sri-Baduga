import json
from pathlib import Path

from langchain_core.documents import Document


class MuseumLoader:
    """
    Membaca dataset museum dan mengubahnya menjadi
    List<Document> agar dapat diproses oleh LangChain.
    """

    def __init__(self, dataset_path: Path):
        self.dataset_path = Path(dataset_path)

    def load(self):

        if not self.dataset_path.exists():
            raise FileNotFoundError(
                f"Dataset tidak ditemukan:\n{self.dataset_path}"
            )

        with open(self.dataset_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        documents = []

        for item in data:

            dimensi = item.get("dimensi", {})

            page_content = f"""
Nama Koleksi : {item.get("nama_koleksi","")}

Nomor Registrasi : {item.get("no_registrasi","")}

Nomor Inventarisasi : {item.get("no_inventarisasi","")}

Klasifikasi : {item.get("klasifikasi","")}

Deskripsi :

{item.get("deskripsi","")}

Tempat Pembuatan :

{item.get("tempat_pembuatan","")}

Tempat Perolehan :

{item.get("tempat_perolehan","")}

Cara Perolehan :

{item.get("cara_perolehan","")}

Tahun Masuk :

{item.get("tahun_masuk","")}

========================
DIMENSI
========================

Panjang : {dimensi.get("panjang","")}

Lebar : {dimensi.get("lebar","")}

Tinggi : {dimensi.get("tinggi","")}

Tebal : {dimensi.get("tebal","")}

Diameter : {dimensi.get("diameter","")}

Berat : {dimensi.get("berat","")}

========================

Tempat Penyimpanan :

{item.get("tempat_penyimpanan","")}

Kondisi :

{item.get("kondisi","")}

Tanggal Pengamatan :

{item.get("tanggal_pengamatan","")}

Nama Petugas :

{item.get("nama_petugas","")}

Acuan :

{item.get("acuan","")}

Keterangan :

{item.get("keterangan","")}
"""

            metadata = {

                "id": item.get("id"),

                "name": item.get("nama_koleksi"),

                "category": item.get("klasifikasi"),

                "registration": item.get("no_registrasi"),

                "inventory": item.get("no_inventarisasi"),

                "location": item.get("tempat_penyimpanan"),

                "condition": item.get("kondisi"),

                "image": item.get("gambar")

            }

            documents.append(

                Document(

                    page_content=page_content,

                    metadata=metadata

                )

            )

        return documents