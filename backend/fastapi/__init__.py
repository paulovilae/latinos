from __future__ import annotations

import inspect
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional


class Depends:
    def __init__(self, dependency: Callable[..., Any] | None = None):
        self.dependency = dependency


class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str | Dict[str, Any]):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class FastAPI:
    def __init__(self, title: str | None = None):
        self.title = title
        self.routes: List[Dict[str, Any]] = []

    def _register(self, method: str, path: str, func: Callable[..., Any], status_code: int | None = None):
        self.routes.append({"method": method, "path": path, "func": func, "status_code": status_code})
        return func

    def post(self, path: str, response_model: Any | None = None, status_code: int | None = None):
        def decorator(func: Callable[..., Any]):
            return self._register("POST", path, func, status_code=status_code)

        return decorator

    def get(self, path: str, response_model: Any | None = None):
        def decorator(func: Callable[..., Any]):
            return self._register("GET", path, func)

        return decorator

    def put(self, path: str, response_model: Any | None = None):
        def decorator(func: Callable[..., Any]):
            return self._register("PUT", path, func)

        return decorator

    def delete(self, path: str, response_model: Any | None = None, status_code: int | None = None):
        def decorator(func: Callable[..., Any]):
            return self._register("DELETE", path, func, status_code=status_code)

        return decorator

    def _match_route(self, method: str, path: str):
        for route in self.routes:
            route_parts = route["path"].strip("/").split("/")
            path_parts = path.strip("/").split("/")
            if route["method"] == method and len(route_parts) == len(path_parts):
                params: Dict[str, str] = {}
                for r, p in zip(route_parts, path_parts):
                    if r.startswith("{") and r.endswith("}"):
                        params[r[1:-1]] = p
                    elif r != p:
                        break
                else:
                    return route, params
        return None, {}

    def _resolve_param(
        self, param: inspect.Parameter, context: Dict[str, Any], path_params: Dict[str, Any], scope: Dict[str, Any]
    ):
        from pydantic import BaseModel

        annotation = param.annotation
        if isinstance(annotation, str):
            annotation = scope.get(annotation, annotation)
            if annotation == "int":
                annotation = int

        if isinstance(param.default, Depends):
            dependency = param.default.dependency
            if dependency is None:
                return None
            return self._call_dependency(dependency, context, path_params)
        if param.name in path_params:
            value = path_params[param.name]
            if annotation is int:
                return int(value)
            return value
        if param.name == "headers":
            return context.get("headers", {})
        if annotation and inspect.isclass(annotation) and issubclass(annotation, BaseModel):
            return annotation(**(context.get("json") or {}))
        if param.name in (context.get("json") or {}):
            return context["json"][param.name]
        return None

    def _call_dependency(self, func: Callable[..., Any], context: Dict[str, Any], path_params: Dict[str, Any]):
        sig = inspect.signature(func)
        kwargs = {}
        scope = getattr(func, "__globals__", None)
        if scope is None and hasattr(func, "__call__"):
            scope = getattr(func.__call__, "__globals__", {})
        scope = scope or {}
        for name, param in sig.parameters.items():
            kwargs[name] = self._resolve_param(param, context, path_params, scope)
        return func(**kwargs)

    def _dispatch(self, method: str, path: str, headers: Dict[str, str], json: Any):
        route, path_params = self._match_route(method, path)
        if not route:
            return Response(status_code=404, json_content={"detail": "Not Found"})
        func = route["func"]
        sig = inspect.signature(func)
        context = {"headers": headers, "json": json}
        kwargs: Dict[str, Any] = {}
        try:
            for name, param in sig.parameters.items():
                kwargs[name] = self._resolve_param(param, context, path_params, func.__globals__)
            result = func(**kwargs)
            status_code = route.get("status_code") or (204 if method == "DELETE" else 200)
            return Response(status_code=status_code, json_content=result)
        except HTTPException as exc:
            return Response(status_code=exc.status_code, json_content={"detail": exc.detail})


@dataclass
class Response:
    status_code: int
    json_content: Any

    def json(self) -> Any:
        return _serialize(self.json_content)


def _serialize(value: Any):
    if isinstance(value, list):
        return [_serialize(v) for v in value]
    if hasattr(value, "dict"):
        return value.dict()
    if hasattr(value, "__dict__"):
        return {k: _serialize(v) for k, v in value.__dict__.items()}
    return value


from .testclient import TestClient  # noqa: E402,F401
from .security import HTTPAuthorizationCredentials, HTTPBearer  # noqa: E402,F401
from . import status  # noqa: E402,F401
