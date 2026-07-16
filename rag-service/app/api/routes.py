from fastapi import APIRouter

from app.api.schemas import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.services.session_service import SessionService

router = APIRouter()

chat_service = ChatService()
session_service = SessionService()


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    session = session_service.get_session(
        request.session_id
    )

    result = chat_service.ask(
        request.question,
        session
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        session_id=session
    )