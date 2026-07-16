from dataclasses import dataclass


@dataclass
class Message:

    role: str
    content: str


class SessionMemory:

    def __init__(self):

        self.messages = []
        self.last_entity = None