from pydantic import BaseModel, field_validator

class PortfolioRequest(BaseModel):
    tickers: list[str]
    weights: list[float]
    period: str = "2y"

    @field_validator("tickers")
    @classmethod
    def normalize_tickers(cls, v):
        result = []
        for t in v:
            t = t.strip().upper()
            if not t.endswith(".NS") and not t.startswith("^"):
                t = f"{t}.NS"
            result.append(t)
        return result

    @field_validator("weights")
    @classmethod
    def weights_must_sum_to_one(cls, v):
        total = sum(v)
        if not (0.99 <= total <= 1.01):
            raise ValueError(f"Weights must sum to 1.0, got {total:.4f}")
        return v