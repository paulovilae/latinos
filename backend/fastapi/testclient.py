from __future__ import annotations

from typing import Any, Dict

from . import Response


class TestClient:
    __test__ = False  # avoid pytest trying to collect this helper as a test case

    def __init__(self, app):
        self.app = app

    def request(self, method: str, url: str, headers: Dict[str, str] | None = None, json: Any | None = None):
        headers = headers or {}
        return self.app._dispatch(method.upper(), url, headers, json)

    def get(self, url: str, headers: Dict[str, str] | None = None):
        return self.request("GET", url, headers=headers)

    def post(self, url: str, headers: Dict[str, str] | None = None, json: Any | None = None):
        return self.request("POST", url, headers=headers, json=json)

    def put(self, url: str, headers: Dict[str, str] | None = None, json: Any | None = None):
        return self.request("PUT", url, headers=headers, json=json)

    def delete(self, url: str, headers: Dict[str, str] | None = None):
        return self.request("DELETE", url, headers=headers)
