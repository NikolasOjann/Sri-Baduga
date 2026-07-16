from typing import Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):

    question: str

    session_id: Optional[str] = None


class ChatResponse(BaseModel):

    answer: str

    sources: list

    session_id: str