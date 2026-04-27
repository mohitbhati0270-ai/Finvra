import yfinance as yf
import pandas as pd
import numpy as np
import time
from config import settings

_price_cache: dict = {}
# Cache now stores both data and skipped info
# Format: { cache_key: { "data": DataFrame, "skipped": list } }

def fetch_prices(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    cache_key = f"{'-'.join(sorted(tickers))}_{period}"

    if cache_key in _price_cache:
        print(f"Cache hit for {cache_key}")
        return _price_cache[cache_key]["data"]

    print(f"Fetching from yfinance: {tickers}")

    valid_frames = {}
    skipped_info = {}

    for i, ticker in enumerate(tickers):
        if i > 0 and i % 5 == 0:
            time.sleep(1)

        series = _fetch_single(ticker, period)

        if series is None:
            clean = ticker.replace('.NS', '')
            try:
                test = yf.download(
                    ticker, period='1mo',
                    auto_adjust=True, progress=False
                )["Close"]
                if test.empty:
                    skipped_info[clean] = "Not found on NSE. Please verify the ticker symbol."
                else:
                    skipped_info[clean] = "Insufficient historical data for the selected period. Try a shorter period like 1y."
            except Exception as e:
                err = str(e).lower()
                if "rate limit" in err or "too many requests" in err:
                    skipped_info[clean] = "Could not fetch due to rate limiting. Try again in a moment."
                else:
                    skipped_info[clean] = "Could not fetch data. Please verify the ticker symbol."
            continue

        valid_frames[ticker] = series

    skipped_list = [{"ticker": t, "reason": r} for t, r in skipped_info.items()]

    if skipped_info:
        print(f"Skipped: {skipped_info}")

    if len(valid_frames) < 2:
        names = ', '.join(skipped_info.keys())
        raise ValueError(
            f"Not enough valid stocks to analyse. "
            f"Could not fetch: {names}. "
            f"Please check ticker symbols or try again."
        )

    data = pd.DataFrame(valid_frames)
    data = data.ffill(limit=5).bfill(limit=5)
    min_required = int(len(data) * 0.7)
    data = data.dropna(axis=1, thresh=min_required)

    if data.shape[1] < 2:
        raise ValueError("After cleaning, fewer than 2 stocks have sufficient data.")

    data = data.fillna(data.mean())
    data = data.dropna(how='all')

    # Store both data AND skipped info in cache
    _price_cache[cache_key] = {
        "data"   : data,
        "skipped": skipped_list,
    }

    return data


def get_skipped_for_tickers(tickers: list[str], period: str) -> list:
    """Get skipped stocks for a given set of tickers from cache."""
    cache_key = f"{'-'.join(sorted(tickers))}_{period}"
    if cache_key in _price_cache:
        return _price_cache[cache_key].get("skipped", [])
    return []


def _fetch_single(ticker: str, period: str, retries: int = 3):
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