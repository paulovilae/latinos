from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class HTTPAuthorizationCredentials:
    scheme: str
    credentials: str


class HTTPBearer:
    def __init__(self, auto_error: bool = True):
        self.auto_error = auto_error

    def __call__(self, headers: Optional[dict] = None):
        headers = headers or {}
        auth = headers.get("Authorization")
        if not auth:
            return None
        try:
            scheme, token = auth.split(" ", 1)
        except ValueError:
            return None
        return HTTPAuthorizationCredentials(scheme=scheme, credentials=token)
