# =====================================================
# Remote Control Tool
# Menangani perintah dari user untuk mengontrol layar/kiosk lain
# secara remote melalui Server Node.js
# =====================================================

import requests

class RemoteControlTool:

    def __init__(self, server_url="http://localhost:3000"):
        self.server_url = server_url

    # =====================================================
    # TOOL NAME
    # =====================================================

    @property
    def name(self):
        return "remote_control"

    # =====================================================
    # DESCRIPTION
    # =====================================================

    @property
    def description(self):
        return (
            "Membuka atau menutup aplikasi/website di layar lain (seperti photobooth, kuis, atau layar koleksi). "
            "Digunakan ketika pengguna meminta untuk membuka photobooth, memainkan quiz, atau menavigasi layar."
        )

    # =====================================================
    # RUN
    # =====================================================

    def run(self, question=None, query=None, context=None, **kwargs):
        command_intent = (question or query or "").lower()

        print()
        print("=" * 60)
        print("REMOTE CONTROL TOOL")
        print("=" * 60)
        print("Command Intent :", command_intent)

        # Mapping niat (intent) user ke target CLIENT_ID dan URL yang sesuai
        target_client = None
        action = "open_url"
        payload_url = ""
        success_message = ""

        if "photobooth" in command_intent or "foto" in command_intent or "kamera" in command_intent:
            target_client = "Kiosk-Photobooth"
            payload_url = "https://photobooth.museum" # Contoh URL, ganti jika perlu
            success_message = "Siap! Layar Photobooth sudah saya nyalakan. Silakan menuju ke area Photobooth."

        elif "quiz" in command_intent or "kuis" in command_intent or "main" in command_intent:
            target_client = "Kiosk-Quiz"
            payload_url = "https://quiz.museum" # Contoh URL
            success_message = "Baik! Aplikasi Quiz sudah saya siapkan di layar kuis. Selamat bermain!"

        elif "koleksi" in command_intent or "katalog" in command_intent or "klasifikasi" in command_intent:
            target_client = "Kiosk-Koleksi"
            payload_url = "http://192.168.100.204:5173/catalog"
            success_message = "Tentu, halaman katalog koleksi sudah saya buka di layar."

        elif "tutup" in command_intent or "close" in command_intent:
            target_client = "Kiosk-Koleksi" # Default jika tidak spesifik
            action = "close_browser"
            success_message = "Baik, aplikasi di layar telah saya tutup."
            
        else:
            # Fallback jika kurang jelas
            target_client = "Laptop-Lokal-01"
            payload_url = "https://google.com"
            success_message = "Perintah diterima, saya telah mengeksekusinya di layar remote."

        # Eksekusi HTTP Request ke Server Hub Node.js
        try:
            api_endpoint = f"{self.server_url}/api/command"
            data = {
                "target": target_client,
                "action": action
            }
            if action == "open_url":
                data["payload"] = {"url": payload_url}

            response = requests.post(api_endpoint, json=data, timeout=5)

            if response.status_code == 200:
                print("Status : SUCCESS (Command sent)")
            elif response.status_code == 403:
                print("Status : FORBIDDEN (Gamification Rule Blocked)")
                try:
                    err_data = response.json()
                    success_message = err_data.get("message", "Akses ditolak oleh sistem.")
                except:
                    success_message = "Maaf, akses ke layar tersebut sedang dikunci oleh sistem."
            else:
                print(f"Status : FAILED (Server returned {response.status_code})")
                success_message = f"Maaf, saya tidak dapat terhubung ke layar '{target_client}' saat ini. Mungkin layarnya sedang mati."
        except requests.exceptions.RequestException as e:
            print("Status : ERROR (Connection failed)", str(e))
            success_message = "Maaf, sistem kontrol layar saat ini sedang tidak aktif (Server Node.js tidak merespons)."

        print("=" * 60)

        return {
            "tool": "remote_control",
            "status": "success",
            "documents": [],
            "answer": success_message,
            "sources": []
        }
