from typing import Dict, Optional
from pydantic import BaseModel, Field


class Credentials(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, max_length=256)
    cookies: Optional[Dict[str, str]] = None
    captcha: Optional[str] = Field(default=None, max_length=20)
    cdigest: Optional[str] = Field(default=None, max_length=128)


class LoginCredentials(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=256)
    cookies: Optional[Dict[str, str]] = None
    captcha: Optional[str] = Field(default=None, max_length=20)
    cdigest: Optional[str] = Field(default=None, max_length=128)
