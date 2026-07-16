from app.memory.models import Message, SessionMemory


class MemoryStorage:

    def __init__(self):

        self.sessions = {}

    def add(self, session_id, role, content):

        if session_id not in self.sessions:
            self.sessions[session_id] = SessionMemory()

        self.sessions[session_id].messages.append(
            Message(role, content)
        )

    def get(self, session_id):

        if session_id not in self.sessions:
            return []

        return self.sessions[session_id].messages

    def clear(self, session_id):

        if session_id in self.sessions:
            del self.sessions[session_id]

    def set_entity(self, session_id, entity):

        if session_id not in self.sessions:
            self.sessions[session_id] = SessionMemory()

        self.sessions[session_id].last_entity = entity

    def get_entity(self, session_id):

        if session_id not in self.sessions:
            return None

        return self.sessions[session_id].last_entity


# ==========================
# Singleton
# ==========================

_storage = MemoryStorage()


def get_storage():
    return _storage