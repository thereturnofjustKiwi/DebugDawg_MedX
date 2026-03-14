"""
chat.py — POST /api/chat

Conversational Q&A endpoint backed by Groq llama-3.3-70b-versatile.
The LLM is grounded to the specific analysis result context sent by the client.
It will refuse to answer anything outside that clinical context.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from groq import Groq
from pydantic import BaseModel

from ...core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Pydantic schemas ────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str          # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]          # full conversation so far (without system)
    analysis_context: Optional[str] = None  # stringified analysis snapshot
    patient_context: Optional[str] = None  # "Name: X · Age: Y · Gender: Z"


class ChatResponse(BaseModel):
    reply: str


# ── System prompt factory ───────────────────────────────────────────────────

def _build_system_prompt(analysis_context: str, patient_context: str) -> str:
    return f"""You are ExplainableMed AI, a medical imaging analysis assistant.

Your ONLY role is to answer questions about the specific patient scan analysis below.
Rules:
- Answer ONLY queries directly related to this analysis result or its clinical implications.
- If asked something outside this context, politely say: "I can only discuss this patient's analysis."
- Keep answers concise and conversational (2-5 sentences max).
- Do NOT fabricate data not present in the context below.
- Use plain language appropriate for a clinician reviewing this report.
- Never give direct treatment prescriptions — only explain what the model found.

--- PATIENT ---
{patient_context or "Not specified"}

--- ANALYSIS RESULT ---
{analysis_context or "No analysis data provided."}
"""


# ── Route ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key not configured.")

    if not request.messages:
        raise HTTPException(status_code=400, detail="messages list is empty.")

    # Validate roles
    for m in request.messages:
        if m.role not in ("user", "assistant"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role '{m.role}'. Must be 'user' or 'assistant'."
            )

    client = Groq(api_key=settings.GROQ_API_KEY)

    system_msg = {
        "role": "system",
        "content": _build_system_prompt(
            request.analysis_context or "",
            request.patient_context or "",
        ),
    }

    groq_messages = [system_msg] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]

    try:
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=groq_messages,
            max_tokens=350,          # conversational — keep it snappy
            temperature=0.4,
            top_p=0.9,
        )
        reply = resp.choices[0].message.content.strip()
        logger.info(f"[chat] Tokens used: {resp.usage.total_tokens}")
        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error(f"[chat] Groq error: {e}")
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")
