import yfinance as yf
import pandas as pd
import numpy as np
import time
from config import settings

_price_cache: dict = {}
_last_skipped: list = []

def get_last_skipped() -> list:
    return _last_skipped.copy()

def _fetch_single(ticker: str, period: str, retries: int = 3) -> pd.Series | None:
    """Fetch a single ticker with retries on rate limit."""
    for attempt in range(retries):
        try:
            raw = yf.download(
                ticker, period=period,
                auto_adjust=True, progress=False
            )["Close"]

            if raw is None or raw.empty:
                return None

            series = raw.squeeze()
            real_count = series.dropna().shape[0]
            if real_count < 60:
                return None

            return series

        except Exception as e:
            err = str(e).lower()
            if "rate limit" in err or "too many requests" in err or "429" in err:
                wait = (attempt + 1) * 3
                print(f"Rate limited on {ticker}, waiting {wait}s (attempt {attempt+1}/{retries})")
                time.sleep(wait)
                continue
            else:
                print(f"Error fetching {ticker}: {e}")
                return None

    print(f"Failed after {retries} retries: {ticker}")
    return None


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

    for i, ticker in enumerate(tickers):
        # Small delay between requests to avoid rate limiting
        if i > 0 and i % 5 == 0:
            time.sleep(1)

        series = _fetch_single(ticker, period)

        if series is None:
            clean = ticker.replace('.NS', '')
            # Try to determine the reason
            try:
                test = yf.download(ticker, period='1mo', auto_adjust=True, progress=False)["Close"]
                if test.empty:
                    skipped_info[clean] = "Not found on NSE. Please verify the ticker symbol."
                else:
                    skipped_info[clean] = f"Insufficient historical data for the selected period. Try a shorter period like 1y."
            except Exception as e:
                err = str(e).lower()
                if "rate limit" in err or "too many requests" in err:
                    skipped_info[clean] = "Could not fetch data due to rate limiting. Try again in a moment."
                else:
                    skipped_info[clean] = "Could not fetch data. Please verify the ticker symbol."
            continue

        valid_frames[ticker] = series

    _last_skipped = [{"ticker": t, "reason": r} for t, r in skipped_info.items()]

    if skipped_info:
        print(f"Skipped: {skipped_info}")

    if len(valid_frames) < 2:
        skipped_list = ', '.join(skipped_info.keys())
        raise ValueError(
            f"Not enough valid stocks to analyse. "
            f"Could not fetch data for: {skipped_list}. "
            f"Please check the ticker symbols or try again in a moment."
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