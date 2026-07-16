from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class MuseumCollection(BaseModel):
    id: Optional[Any] = None
    no_registrasi: Optional[str] = ""
    no_inventarisasi: Optional[str] = ""
    nama_koleksi: str
    klasifikasi: Optional[str] = ""
    deskripsi: Optional[str] = ""
    tempat_pembuatan: Optional[str] = ""
    tempat_perolehan: Optional[str] = ""
    cara_perolehan: Optional[str] = ""
    tahun_masuk: Optional[str] = ""
    dimensi: Optional[Dict[str, Any]] = Field(default_factory=dict)
    tempat_penyimpanan: Optional[str] = ""
    kondisi: Optional[str] = ""
    tanggal_pengamatan: Optional[str] = ""
    nama_petugas: Optional[str] = ""
    acuan: Optional[str] = ""
    keterangan: Optional[str] = ""
    gambar: Optional[str] = ""

    model_config = {
        "extra": "allow"
    }
