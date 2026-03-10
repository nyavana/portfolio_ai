from typing import Optional

from pydantic import BaseModel


class QuestionRequest(BaseModel):
    question: str


class LlmConfigRequest(BaseModel):
    base_url: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None


class LlmConfigResponse(BaseModel):
    base_url: str
    model: str
    api_key_configured: bool
    api_key_hint: str  # e.g. "sk-abc****" or ""