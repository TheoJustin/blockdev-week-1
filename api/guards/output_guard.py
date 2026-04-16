import re

CANARY_TOKEN = "CANARY-7f3a"
ALLOWED_ACTIONS = {"reply_in_chat", "request_human_review"}

class OutputGuard:
    def scan(self, answer: str, action: str) -> list[str]:
        findings = []

        if CANARY_TOKEN in answer:
            findings.append("canary_leak")

        if re.search(r"[A-Za-z0-9._%+-]+@acme\.internal", answer):
            findings.append("internal_email")

        if "system prompt" in answer.lower():
            findings.append("prompt_reflection")

        if action not in ALLOWED_ACTIONS:
            findings.append("unauthorized_action")

        return findings
