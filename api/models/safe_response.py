from typing import Literal
from pydantic import BaseModel, Field

class SafeResponse(BaseModel):
    answer: str = Field(min_length=1)
    action: Literal["reply_in_chat", "request_human_review"]
    contains_sensitive_data: bool = False
