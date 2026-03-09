from __future__ import annotations

from typing import Any, Dict, List, Optional

from openai import OpenAI

from app.config import LMDEPLOY_BASE_URL, LMDEPLOY_API_KEY, LMDEPLOY_MODEL


class LMDeployClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        self.base_url = (base_url or LMDEPLOY_BASE_URL).rstrip("/")
        self.api_key = api_key or LMDEPLOY_API_KEY
        self.model = model or LMDEPLOY_MODEL

        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_completion_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""

    def chat_with_messages(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_completion_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""