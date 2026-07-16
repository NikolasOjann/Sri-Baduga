import json
import time
from pathlib import Path

from app.core.config import settings


class LoggingService:

    def __init__(self):

        self.log_file = settings.BASE_DIR / "app/logs/ai_logs.json"

    def save(
        self,
        session,
        question,
        answer,
        documents,
        response_time,
        confidence=0.0
    ):

        try:

            # Pastikan folder ada
            self.log_file.parent.mkdir(
                parents=True,
                exist_ok=True
            )

            # Jika file belum ada
            if not self.log_file.exists():

                with open(
                    self.log_file,
                    "w",
                    encoding="utf-8"
                ) as f:

                    json.dump([], f)

            # Load log lama
            with open(
                self.log_file,
                "r",
                encoding="utf-8"
            ) as f:

                logs = json.load(f)

            # Tambah log baru
            logs.append({

                "time": time.strftime("%Y-%m-%d %H:%M:%S"),

                "session": session,

                "question": question,

                "answer": answer,

                "documents": documents,

                "confidence": round(confidence, 3),

                "response_time": round(response_time, 2)

            })

            # Simpan kembali
            with open(
                self.log_file,
                "w",
                encoding="utf-8"
            ) as f:

                json.dump(
                    logs,
                    f,
                    ensure_ascii=False,
                    indent=4
                )

        except Exception as e:

            print(f"[Logging Error] {e}")