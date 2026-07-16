from app.sessions.session_manager import SessionManager


class SessionService:

    def __init__(self):

        self.manager = SessionManager()

    def get_session(self, session_id=None):

        # ====================================
        # Frontend mengirim session
        # ====================================

        if session_id:

            # kalau belum ada, simpan
            if not self.manager.exists(session_id):
                self.manager.add(session_id)

            return session_id

        # ====================================
        # Tidak ada session
        # ====================================

        return self.manager.create()