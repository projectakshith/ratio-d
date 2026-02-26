from typing import Dict, Optional

from pydantic import BaseModel


class Credentials(BaseModel):
    username: str
    password: str
    cookies: Optional[Dict[str, str]] = None
