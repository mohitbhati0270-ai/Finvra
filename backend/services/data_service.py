import yfinance as yf
import pandas as pd
import numpy as np
from config import settings

_price_cache: dict = {}

# Global to track skipped tickers for current request
_last_skipped: list = []

def get_last_skipped() -> list:
    return _last_skipped.copy()

def fetch_prices(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    global _last_skipped
    _last_skipped = []

    cache_key = f"{'-'.join(sorted(tickers))}_{period}"

    if cache_key in _price_cache:
        print(f"Cache hit for {cache_key}")
        return _price_cache[cache_key]

    print(f"Fetching from yfinance: {tickers}")

    valid_frames = {}
    skipped_info = {}

    for ticker in tickers:
        try:
            raw = yf.download(
                ticker, period=period,
                auto_adjust=True, progress=False
            )["Close"]

            if raw is None or raw.empty:
                skipped_info[ticker.replace('.NS','')] = "No data found on NSE. Please verify the ticker symbol."
                continue

            series = raw.squeeze()
            real_data_count = series.dropna().shape[0]

            if real_data_count < 60:
                skipped_info[ticker.replace('.NS','')] = f"Only {real_data_count} days of data available. Minimum 60 days required."
                continue

            valid_frames[ticker] = series

        except Exception as e:
            skipped_info[ticker.replace('.NS','')] = f"Failed to fetch: {str(e)}"
            continue

    _last_skipped = [
        {"ticker": t, "reason": r}
        for t, r in skipped_info.items()
    ]

    if skipped_info:
        print(f"Skipped: {skipped_info}")

    if len(valid_frames) < 2:
        skipped_list = ', '.join(skipped_info.keys())
        raise ValueError(
            f"Not enough valid stocks. These could not be fetched: {skipped_list}. "
            f"Please check the ticker symbols or try a shorter period."
        )

    data = pd.DataFrame(valid_frames)
    data = data.ffill(limit=5).bfill(limit=5)
    min_required = int(len(data) * 0.7)
    data = data.dropna(axis=1, thresh=min_required)

    if data.shape[1] < 2:
        raise ValueError("After cleaning, fewer than 2 stocks have sufficient data.")

    data = data.fillna(data.mean())
    data = data.dropna(how='all')

    _price_cache[cache_key] = data
    return data


def get_returns(prices: pd.DataFrame) -> pd.DataFrame:
    returns = prices.pct_change().dropna(how='all')
    returns = returns.dropna(axis=1, how='all')
    returns = returns.ffill().bfill()
    returns = returns.dropna(how='any')
    return returns


def fetch_benchmark(period: str = "2y") -> pd.Series:
    bench = yf.download(
        settings.default_benchmark,
        period=period,
        auto_adjust=True,
        progress=False
    )["Close"]
    return bench.squeeze()