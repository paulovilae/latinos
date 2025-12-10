from __future__ import annotations

from typing import Any


class BaseModel:
    def __init__(self, **data: Any):
        for key, value in data.items():
            setattr(self, key, value)

    def dict(self):
        return self.__dict__

    def model_dump(self):
        return self.__dict__


class EmailStr(str):
    pass


def Field(default: Any = None, **_: Any):
    return default
