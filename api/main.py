"""
FastAPI scaffold for the next phase of the demo.

The first milestone keeps inference mocked on the frontend so the vulnerable
experience is deterministic during recording. We will wire the real input and
output guards into this API next.
"""

from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="Guardrail Failure Lab API", version="0.1.0")


class ChatRequest(BaseModel):
    prompt: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/demo/chat")
def demo_chat(payload: ChatRequest) -> dict[str, str]:
    return {
        "mode": "scaffold",
        "message": (
            "The Python API scaffold is ready. Next we will move the vulnerable "
            "logic here and add InputGuard and OutputGuard."
        ),
        "prompt": payload.prompt,
    }
