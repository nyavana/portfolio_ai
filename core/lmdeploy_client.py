from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from openai import OpenAI


DEFAULT_BASE_URL = "http://127.0.0.1:23333/v1"
DEFAULT_API_KEY = "lmdeploy"
DEFAULT_MODEL = "/burg-archive/stats/users/kj2712/6895/LLaMA-Factory/saves/llama"


class LMDeployClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("LMDEPLOY_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.api_key = api_key or os.getenv("LMDEPLOY_API_KEY") or DEFAULT_API_KEY
        self.model = model or os.getenv("LMDEPLOY_MODEL") or DEFAULT_MODEL

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
            temperature=temperature,
            max_tokens=max_tokens,
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
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""