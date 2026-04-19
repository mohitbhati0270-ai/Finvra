import yfinance as yf
import pandas as pd
import numpy as np
from config import settings

_price_cache: dict = {}

def fetch_prices(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    cache_key = f"{'-'.join(sorted(tickers))}_{period}"
    
    if cache_key in _price_cache:
        print(f"Cache hit for {cache_key}")
        return _price_cache[cache_key]
    
    print(f"Fetching from yfinance: {tickers}")
    
    try:
        if len(tickers) == 1:
            data = yf.download(tickers[0], period=period,
                               auto_adjust=True, progress=False)["Close"]
            data = data.to_frame(name=tickers[0])
        else:
            data = yf.download(tickers, period=period,
                               auto_adjust=True, progress=False)["Close"]
    except Exception as e:
        raise ValueError(f"Failed to fetch price data: {str(e)}")

    if data.empty:
        raise ValueError(f"No data returned for tickers: {tickers}")

    data = data.ffill(limit=5)
    data = data.dropna(how="all")
    data = data.fillna(data.mean())

    _price_cache[cache_key] = data
    return data

def get_returns(prices: pd.DataFrame) -> pd.DataFrame:
    return prices.pct_change().dropna()

def fetch_benchmark(period: str = "2y") -> pd.Series:
    bench = yf.download(
        settings.default_benchmark,
        period=period,
        auto_adjust=True,
        progress=False
    )["Close"]
    return bench.squeeze()