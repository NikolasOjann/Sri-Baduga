import uuid


class SessionManager:

    def __init__(self):

        self.sessions = set()

    def create(self):

        session_id = str(uuid.uuid4())

        self.sessions.add(session_id)

        return session_id

    def add(self, session_id):

        self.sessions.add(session_id)

    def exists(self, session_id):

        return session_id in self.sessions

    def remove(self, session_id):

        if session_id in self.sessions:
            self.sessions.remove(session_id)

    def get_all(self):

        return list(self.sessions)