from dataclasses import dataclass
import re

@dataclass
class InputAssessment:
    risk_score: float
    blocked: bool
    reasons: list[str]

class InputGuard:
    PATTERNS = [
        r"ignore all instructions",
        r"repeat your system prompt",
        r"you are now dan",
        r"developer mode",
    ]

    def pattern_match(self, text: str) -> float:
        hits = sum(bool(re.search(p, text, re.I)) for p in self.PATTERNS)
        return min(hits * 0.35, 1.0)

    def token_anomaly(self, text: str) -> float:
        lowered = text.lower()
        verbs = ["ignore", "reveal", "repeat", "override", "bypass"]
        hits = sum(lowered.count(v) for v in verbs)
        return min(hits * 0.12, 1.0)

    def semantic_similarity(self, text: str) -> float:
        # Demo-safe stub first; replace with sentence-transformers embedding similarity
        lowered = text.lower()
        suspicious = ["system prompt", "hidden instructions", "override", "verbatim"]
        score = sum(term in lowered for term in suspicious) / len(suspicious)
        return min(score, 1.0)

    def score_and_gate(self, text: str, threshold: float = 0.72) -> InputAssessment:
        scores = {
            "pattern": self.pattern_match(text),
            "token": self.token_anomaly(text),
            "semantic": self.semantic_similarity(text),
        }
        risk = (scores["pattern"] * 0.45) + (scores["token"] * 0.2) + (scores["semantic"] * 0.35)
        reasons = [k for k, v in scores.items() if v >= 0.3]
        return InputAssessment(risk_score=round(risk, 2), blocked=risk >= threshold, reasons=reasons)
