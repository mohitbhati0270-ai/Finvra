from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "Finvra"
    risk_free_rate: float = 0.065
    trading_days: int = 252
    default_benchmark: str = "^NSEI"
    default_period: str = "2y"

    class Config:
        env_file = ".env"

settings = Settings()

# Default portfolio — change tickers and weights here
# and it will reflect everywhere in the app
DEFAULT_PORTFOLIO = {
    "tickers": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "WIPRO"],
    "weights": [0.30, 0.25, 0.20, 0.15, 0.10],
}